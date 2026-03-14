import { create } from 'zustand';
import { Note } from '../types';
import { dbService, initDatabase } from '../services/dbService';

interface NoteStore {
  notes: Note[];
  deletedNotes: Note[];
  currentNoteId: string | null;
  isLoading: boolean;
  initialized: boolean;
  
  // 历史记录（用于撤销/重做）
  history: {
    past: Note[][];
    future: Note[][];
  };
  canUndo: boolean;
  canRedo: boolean;
  
  init: () => Promise<void>;
  loadNotes: () => void;
  loadDeletedNotes: () => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string, permanent?: boolean) => void;
  restoreNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
  emptyTrash: () => void;
  setCurrentNote: (id: string | null) => void;
  getCurrentNote: () => Note | null;
  
  // 撤销/重做
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  updateHistoryState: () => void;
  
  // 批量操作
  batchUpdate: (updates: { id: string; changes: Partial<Note> }[]) => void;
  batchDelete: (ids: string[]) => void;
  batchRestore: (ids: string[]) => void;
}

const MAX_HISTORY_SIZE = 50;

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  deletedNotes: [],
  currentNoteId: null,
  isLoading: false,
  initialized: false,
  history: {
    past: [],
    future: [],
  },
  canUndo: false,
  canRedo: false,

  init: async () => {
    if (get().initialized) return;
    await initDatabase();
    get().loadNotes();
    get().loadDeletedNotes();
    set({ initialized: true });
  },

  loadNotes: () => {
    set({ isLoading: true });
    try {
      const allNotes = dbService.getNotes ? dbService.getNotes() : [];
      // 过滤掉已删除的笔记
      const activeNotes = allNotes.filter((note: Note) => !note.isDeleted);
      set({ notes: activeNotes });
      get().updateHistoryState();
    } catch (error) {
      console.error('加载笔记失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadDeletedNotes: () => {
    try {
      const allNotes = dbService.getNotes ? dbService.getNotes() : [];
      const deleted = allNotes.filter((note: Note) => note.isDeleted);
      set({ deletedNotes: deleted });
    } catch (error) {
      console.error('加载回收站失败:', error);
    }
  },

  saveHistory: () => {
    const { notes, history } = get();
    const newPast = [...history.past, JSON.parse(JSON.stringify(notes))];
    
    // 限制历史记录大小
    if (newPast.length > MAX_HISTORY_SIZE) {
      newPast.shift();
    }
    
    set({
      history: {
        past: newPast,
        future: [],
      },
      canUndo: newPast.length > 0,
      canRedo: false,
    });
  },

  updateHistoryState: () => {
    const { history } = get();
    set({
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    });
  },

  undo: () => {
    const { notes, history } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    set({
      notes: previous,
      history: {
        past: newPast,
        future: [JSON.parse(JSON.stringify(notes)), ...history.future],
      },
    });
    
    get().updateHistoryState();
    
    // 同步到数据库
    try {
      previous.forEach((note: Note) => {
        if (dbService.updateNote) {
          dbService.updateNote(note.id, note);
        }
      });
    } catch (error) {
      console.error('撤销同步失败:', error);
    }
  },

  redo: () => {
    const { notes, history } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      notes: next,
      history: {
        past: [...history.past, JSON.parse(JSON.stringify(notes))],
        future: newFuture,
      },
    });
    
    get().updateHistoryState();
    
    // 同步到数据库
    try {
      next.forEach((note: Note) => {
        if (dbService.updateNote) {
          dbService.updateNote(note.id, note);
        }
      });
    } catch (error) {
      console.error('重做同步失败:', error);
    }
  },

  addNote: (note) => {
    get().saveHistory();
    
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      if (dbService.addNote) {
        dbService.addNote(newNote);
      }
    } catch (error) {
      console.error('添加笔记失败:', error);
    }
    
    set((state) => ({ 
      notes: [newNote, ...state.notes],
      currentNoteId: newNote.id 
    }));
    
    return newNote;
  },

  updateNote: (id, updates) => {
    const { notes } = get();
    const noteIndex = notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) return;

    // 保存历史记录（只在非自动保存时保存，比如标题或内容变更）
    if (updates.title !== undefined || updates.content !== undefined) {
      get().saveHistory();
    }

    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    try {
      if (dbService.updateNote) {
        dbService.updateNote(id, updatedNote);
      }
    } catch (error) {
      console.error('更新笔记失败:', error);
    }

    const newNotes = [...notes];
    newNotes[noteIndex] = updatedNote;
    set({ notes: newNotes });
  },

  deleteNote: (id, permanent = false) => {
    if (permanent) {
      get().permanentlyDeleteNote(id);
      return;
    }

    get().saveHistory();

    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const updatedNote = {
      ...note,
      isDeleted: true,
      deletedAt: Date.now(),
    };

    try {
      if (dbService.updateNote) {
        dbService.updateNote(id, updatedNote);
      }
    } catch (error) {
      console.error('删除笔记失败:', error);
    }

    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      deletedNotes: [updatedNote, ...state.deletedNotes],
      currentNoteId: state.currentNoteId === id ? null : state.currentNoteId,
    }));
  },

  restoreNote: (id) => {
    get().saveHistory();

    const { deletedNotes } = get();
    const note = deletedNotes.find((n) => n.id === id);
    if (!note) return;

    const restoredNote = {
      ...note,
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: Date.now(),
    };

    try {
      if (dbService.updateNote) {
        dbService.updateNote(id, restoredNote);
      }
    } catch (error) {
      console.error('恢复笔记失败:', error);
    }

    set((state) => ({
      notes: [restoredNote, ...state.notes],
      deletedNotes: state.deletedNotes.filter((n) => n.id !== id),
    }));
  },

  permanentlyDeleteNote: (id) => {
    try {
      if (dbService.deleteNote) {
        dbService.deleteNote(id);
      }
    } catch (error) {
      console.error('永久删除笔记失败:', error);
    }

    set((state) => ({
      deletedNotes: state.deletedNotes.filter((n) => n.id !== id),
    }));
  },

  emptyTrash: () => {
    const { deletedNotes } = get();
    
    try {
      deletedNotes.forEach((note) => {
        if (dbService.deleteNote) {
          dbService.deleteNote(note.id);
        }
      });
    } catch (error) {
      console.error('清空回收站失败:', error);
    }

    set({ deletedNotes: [] });
  },

  setCurrentNote: (id) => {
    set({ currentNoteId: id });
  },

  getCurrentNote: () => {
    const { notes, currentNoteId } = get();
    return notes.find((note) => note.id === currentNoteId) || null;
  },

  batchUpdate: (updates) => {
    get().saveHistory();

    const { notes } = get();
    const newNotes = [...notes];

    updates.forEach(({ id, changes }) => {
      const index = newNotes.findIndex((n) => n.id === id);
      if (index !== -1) {
        newNotes[index] = { ...newNotes[index], ...changes, updatedAt: Date.now() };
        try {
          if (dbService.updateNote) {
            dbService.updateNote(id, newNotes[index]);
          }
        } catch (error) {
          console.error('批量更新失败:', error);
        }
      }
    });

    set({ notes: newNotes });
  },

  batchDelete: (ids) => {
    get().saveHistory();

    const { notes } = get();
    const now = Date.now();
    const deletedNotesToAdd: Note[] = [];

    ids.forEach((id) => {
      const note = notes.find((n) => n.id === id);
      if (note) {
        const deletedNote = { ...note, isDeleted: true, deletedAt: now };
        deletedNotesToAdd.push(deletedNote);
        try {
          if (dbService.updateNote) {
            dbService.updateNote(id, deletedNote);
          }
        } catch (error) {
          console.error('批量删除失败:', error);
        }
      }
    });

    set((state) => ({
      notes: state.notes.filter((n) => !ids.includes(n.id)),
      deletedNotes: [...deletedNotesToAdd, ...state.deletedNotes],
      currentNoteId: ids.includes(state.currentNoteId || '') ? null : state.currentNoteId,
    }));
  },

  batchRestore: (ids) => {
    get().saveHistory();

    const { deletedNotes } = get();
    const restoredNotes: Note[] = [];

    ids.forEach((id) => {
      const note = deletedNotes.find((n) => n.id === id);
      if (note) {
        const restoredNote = { ...note, isDeleted: false, deletedAt: undefined, updatedAt: Date.now() };
        restoredNotes.push(restoredNote);
        try {
          if (dbService.updateNote) {
            dbService.updateNote(id, restoredNote);
          }
        } catch (error) {
          console.error('批量恢复失败:', error);
        }
      }
    });

    set((state) => ({
      notes: [...restoredNotes, ...state.notes],
      deletedNotes: state.deletedNotes.filter((n) => !ids.includes(n.id)),
    }));
  },
}));
