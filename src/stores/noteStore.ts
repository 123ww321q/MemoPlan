import { create } from 'zustand';
import { Note } from '../types';
import { dbService, initDatabase } from '../services/dbService';

interface NoteStore {
  notes: Note[];
  deletedNotes: Note[];
  currentNoteId: string | null;
  isLoading: boolean;
  initialized: boolean;
  searchResults: Note[];
  isSearching: boolean;
  
  // 历史记录（用于撤销/重做）
  history: {
    past: Note[][];
    future: Note[][];
  };
  canUndo: boolean;
  canRedo: boolean;
  
  init: () => Promise<void>;
  loadNotes: () => Promise<void>;
  loadDeletedNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string, permanent?: boolean) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  setCurrentNote: (id: string | null) => void;
  getCurrentNote: () => Note | null;
  
  // 搜索
  searchNotes: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // 撤销/重做
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  
  // 批量操作
  batchUpdate: (updates: { id: string; changes: Partial<Note> }[]) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  batchRestore: (ids: string[]) => Promise<void>;
}

const MAX_HISTORY_SIZE = 50;

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  deletedNotes: [],
  currentNoteId: null,
  isLoading: false,
  initialized: false,
  searchResults: [],
  isSearching: false,
  history: {
    past: [],
    future: [],
  },
  canUndo: false,
  canRedo: false,

  init: async () => {
    if (get().initialized) return;
    await initDatabase();
    await get().loadNotes();
    await get().loadDeletedNotes();
    set({ initialized: true });
  },

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await dbService.getNotes(false);
      set({ notes });
    } catch (error) {
      console.error('加载笔记失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadDeletedNotes: async () => {
    try {
      const allNotes = await dbService.getNotes(true);
      const deleted = allNotes.filter((note: Note) => note.isDeleted);
      set({ deletedNotes: deleted });
    } catch (error) {
      console.error('加载回收站失败:', error);
    }
  },

  searchNotes: async (query: string) => {
    if (!query.trim()) {
      get().clearSearch();
      return;
    }
    
    set({ isSearching: true });
    try {
      const results = await dbService.searchNotes(query);
      set({ searchResults: results });
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], isSearching: false });
  },

  saveHistory: () => {
    const { notes, history } = get();
    const newPast = [...history.past, JSON.parse(JSON.stringify(notes))];
    
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
      canUndo: newPast.length > 0,
      canRedo: true,
    });
    
    // 同步到数据库
    Promise.all(previous.map((note: Note) => dbService.updateNote(note.id, note)))
      .catch(error => console.error('撤销同步失败:', error));
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
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
    
    // 同步到数据库
    Promise.all(next.map((note: Note) => dbService.updateNote(note.id, note)))
      .catch(error => console.error('重做同步失败:', error));
  },

  addNote: async (note) => {
    get().saveHistory();
    
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await dbService.addNote(newNote);
      set((state) => ({ 
        notes: [newNote, ...state.notes],
        currentNoteId: newNote.id 
      }));
    } catch (error) {
      console.error('添加笔记失败:', error);
    }
    
    return newNote;
  },

  updateNote: async (id, updates) => {
    const { notes } = get();
    const noteIndex = notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) return;

    if (updates.title !== undefined || updates.content !== undefined) {
      get().saveHistory();
    }

    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    try {
      await dbService.updateNote(id, updatedNote);
      const newNotes = [...notes];
      newNotes[noteIndex] = updatedNote;
      set({ notes: newNotes });
    } catch (error) {
      console.error('更新笔记失败:', error);
    }
  },

  deleteNote: async (id, permanent = false) => {
    if (permanent) {
      await get().permanentlyDeleteNote(id);
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
      await dbService.updateNote(id, updatedNote);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        deletedNotes: [updatedNote, ...state.deletedNotes],
        currentNoteId: state.currentNoteId === id ? null : state.currentNoteId,
      }));
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  },

  restoreNote: async (id) => {
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
      await dbService.updateNote(id, restoredNote);
      set((state) => ({
        notes: [restoredNote, ...state.notes],
        deletedNotes: state.deletedNotes.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error('恢复笔记失败:', error);
    }
  },

  permanentlyDeleteNote: async (id) => {
    try {
      await dbService.deleteNote(id);
      set((state) => ({
        deletedNotes: state.deletedNotes.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error('永久删除笔记失败:', error);
    }
  },

  emptyTrash: async () => {
    const { deletedNotes } = get();
    
    try {
      await Promise.all(deletedNotes.map(note => dbService.deleteNote(note.id)));
      set({ deletedNotes: [] });
    } catch (error) {
      console.error('清空回收站失败:', error);
    }
  },

  setCurrentNote: (id) => {
    set({ currentNoteId: id });
  },

  getCurrentNote: () => {
    const { notes, currentNoteId } = get();
    return notes.find((note) => note.id === currentNoteId) || null;
  },

  batchUpdate: async (updates) => {
    get().saveHistory();

    const { notes } = get();
    const newNotes = [...notes];

    for (const { id, changes } of updates) {
      const index = newNotes.findIndex((n) => n.id === id);
      if (index !== -1) {
        newNotes[index] = { ...newNotes[index], ...changes, updatedAt: Date.now() };
        try {
          await dbService.updateNote(id, newNotes[index]);
        } catch (error) {
          console.error('批量更新失败:', error);
        }
      }
    }

    set({ notes: newNotes });
  },

  batchDelete: async (ids) => {
    get().saveHistory();

    const { notes } = get();
    const now = Date.now();
    const deletedNotesToAdd: Note[] = [];

    for (const id of ids) {
      const note = notes.find((n) => n.id === id);
      if (note) {
        const deletedNote = { ...note, isDeleted: true, deletedAt: now };
        deletedNotesToAdd.push(deletedNote);
        try {
          await dbService.updateNote(id, deletedNote);
        } catch (error) {
          console.error('批量删除失败:', error);
        }
      }
    }

    set((state) => ({
      notes: state.notes.filter((n) => !ids.includes(n.id)),
      deletedNotes: [...deletedNotesToAdd, ...state.deletedNotes],
      currentNoteId: ids.includes(state.currentNoteId || '') ? null : state.currentNoteId,
    }));
  },

  batchRestore: async (ids) => {
    get().saveHistory();

    const { deletedNotes } = get();
    const restoredNotes: Note[] = [];

    for (const id of ids) {
      const note = deletedNotes.find((n) => n.id === id);
      if (note) {
        const restoredNote = { ...note, isDeleted: false, deletedAt: undefined, updatedAt: Date.now() };
        restoredNotes.push(restoredNote);
        try {
          await dbService.updateNote(id, restoredNote);
        } catch (error) {
          console.error('批量恢复失败:', error);
        }
      }
    }

    set((state) => ({
      notes: [...restoredNotes, ...state.notes],
      deletedNotes: state.deletedNotes.filter((n) => !ids.includes(n.id)),
    }));
  },
}));
