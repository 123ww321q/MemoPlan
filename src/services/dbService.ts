import { invoke } from '@tauri-apps/api/tauri';
import { Note, Task } from '../types';

// Rust 数据库结构映射
interface DbNote {
  id: string;
  title: string;
  content: string;
  tags: string; // JSON string
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at?: number;
  color?: string;
  font_size?: number;
  font_family?: string;
  category: string;
  created_at: number;
  updated_at: number;
}

interface DbTask {
  id: string;
  note_id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date?: number;
  level: number;
  parent_id?: string;
  order_index: number;
  created_at: number;
  updated_at: number;
}

interface DbTag {
  id: string;
  name: string;
  color?: string;
  created_at: number;
}

// 转换函数
function toDbNote(note: Note): DbNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: JSON.stringify(note.tags),
    is_pinned: note.isPinned,
    is_favorite: note.isFavorite,
    is_archived: note.isArchived,
    is_deleted: note.isDeleted,
    deleted_at: note.deletedAt,
    color: note.color,
    font_size: note.fontSize,
    font_family: note.fontFamily,
    category: note.category,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

function fromDbNote(dbNote: DbNote): Note {
  return {
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content,
    tags: JSON.parse(dbNote.tags || '[]'),
    isPinned: dbNote.is_pinned,
    isFavorite: dbNote.is_favorite,
    isArchived: dbNote.is_archived,
    isDeleted: dbNote.is_deleted,
    deletedAt: dbNote.deleted_at,
    color: dbNote.color,
    fontSize: dbNote.font_size,
    fontFamily: dbNote.font_family,
    category: dbNote.category as 'notes' | 'study' | 'work' | 'tasks',
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at,
  };
}

function toDbTask(task: Task): DbTask {
  return {
    id: task.id,
    note_id: task.noteId,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    due_date: task.dueDate,
    level: task.level,
    parent_id: task.parentId,
    order_index: task.order,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

function fromDbTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    noteId: dbTask.note_id,
    title: dbTask.title,
    completed: dbTask.completed,
    priority: dbTask.priority as 'high' | 'medium' | 'low',
    dueDate: dbTask.due_date,
    level: dbTask.level,
    parentId: dbTask.parent_id,
    order: dbTask.order_index,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}

// 数据库服务
export const dbService = {
  // 笔记操作
  addNote: async (note: Note): Promise<void> => {
    await invoke('db_add_note', { note: toDbNote(note) });
  },

  updateNote: async (id: string, updates: Partial<Note>): Promise<void> => {
    const existing = await dbService.getNoteById(id);
    if (!existing) throw new Error('Note not found');
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await invoke('db_update_note', { note: toDbNote(updated) });
  },

  deleteNote: async (id: string): Promise<void> => {
    await invoke('db_delete_note_permanently', { id });
  },

  getNoteById: async (id: string): Promise<Note | null> => {
    const result = await invoke<DbNote | null>('db_get_note_by_id', { id });
    return result ? fromDbNote(result) : null;
  },

  getNotes: async (includeDeleted = false): Promise<Note[]> => {
    const results = await invoke<DbNote[]>('db_get_all_notes', { includeDeleted });
    return results.map(fromDbNote);
  },

  searchNotes: async (query: string): Promise<Note[]> => {
    const results = await invoke<DbNote[]>('db_search_notes', { query });
    return results.map(fromDbNote);
  },

  // 任务操作
  addTask: async (task: Task): Promise<void> => {
    await invoke('db_add_task', { task: toDbTask(task) });
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<void> => {
    const existing = await dbService.getTaskById(id);
    if (!existing) throw new Error('Task not found');
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await invoke('db_update_task', { task: toDbTask(updated) });
  },

  deleteTask: async (id: string): Promise<void> => {
    await invoke('db_delete_task', { id });
  },

  getTaskById: async (id: string): Promise<Task | null> => {
    const tasks = await dbService.getTasks();
    return tasks.find(t => t.id === id) || null;
  },

  getTasks: async (): Promise<Task[]> => {
    const results = await invoke<DbTask[]>('db_get_all_tasks');
    return results.map(fromDbTask);
  },

  getTasksByNoteId: async (noteId: string): Promise<Task[]> => {
    const results = await invoke<DbTask[]>('db_get_tasks_by_note_id', { noteId });
    return results.map(fromDbTask);
  },

  // 标签操作
  addTag: async (tag: { id: string; name: string; color?: string; createdAt: number }): Promise<void> => {
    await invoke('db_add_tag', { tag });
  },

  updateTag: async (tag: { id: string; name: string; color?: string; createdAt: number }): Promise<void> => {
    await invoke('db_update_tag', { tag });
  },

  deleteTag: async (id: string): Promise<void> => {
    await invoke('db_delete_tag', { id });
  },

  getTags: async (): Promise<DbTag[]> => {
    return await invoke<DbTag[]>('db_get_all_tags');
  },

  // 设置操作
  setSetting: async (key: string, value: string): Promise<void> => {
    await invoke('db_set_setting', { key, value });
  },

  getSetting: async (key: string): Promise<string | null> => {
    return await invoke<string | null>('db_get_setting', { key });
  },

  // 数据迁移
  migrateFromLocalStorage: async (): Promise<void> => {
    const notes = localStorage.getItem('memoplan_notes') || '[]';
    const tasks = localStorage.getItem('memoplan_tasks') || '[]';
    const settings = localStorage.getItem('memoplan_settings') || '{}';

    await invoke('db_migrate_from_json', {
      data: { notes, tasks, settings }
    });

    // Clear localStorage after successful migration
    localStorage.removeItem('memoplan_notes');
    localStorage.removeItem('memoplan_tasks');
    localStorage.removeItem('memoplan_settings');
    localStorage.setItem('memoplan_migrated', 'true');
  },

  checkMigrationStatus: (): boolean => {
    return localStorage.getItem('memoplan_migrated') === 'true';
  },
};

// 初始化数据库
export const initDatabase = async (): Promise<void> => {
  // Check if migration is needed
  if (!dbService.checkMigrationStatus()) {
    const notes = localStorage.getItem('memoplan_notes');
    const hasLocalData = notes && JSON.parse(notes).length > 0;
    
    if (hasLocalData) {
      console.log('Migrating data from localStorage to SQLite...');
      await dbService.migrateFromLocalStorage();
      console.log('Migration completed!');
    } else {
      localStorage.setItem('memoplan_migrated', 'true');
    }
  }
};
