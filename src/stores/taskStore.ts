import { create } from 'zustand';
import { Task } from '../types';
import { dbService, initDatabase } from '../services/dbService';
import { MarkdownParser } from '../services/markdownParser';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  loadTasks: () => void;
  loadTasksByNoteId: (noteId: string) => Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteTasksByNoteId: (noteId: string) => void;
  getTasksByNoteId: (noteId: string) => Task[];
  toggleTaskComplete: (id: string) => void;
  // 一键生成待办
  convertMarkdownToTasks: (markdown: string, noteId: string) => number;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    await initDatabase();
    get().loadTasks();
    set({ initialized: true });
  },

  loadTasks: () => {
    set({ isLoading: true });
    try {
      const tasks = dbService.getTasks();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTasksByNoteId: (noteId: string) => {
    return dbService.getTasksByNoteId(noteId);
  },

  addTask: (task) => {
    const newTask = dbService.addTask(task);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  addTasks: (newTasks) => {
    const createdTasks = dbService.addTasks(newTasks);
    set((state) => ({ tasks: [...state.tasks, ...createdTasks] }));
  },

  updateTask: (id, updates) => {
    const updatedTask = dbService.updateTask(id, updates);
    if (updatedTask) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
      }));
    }
  },

  deleteTask: (id) => {
    dbService.deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  deleteTasksByNoteId: (noteId: string) => {
    dbService.deleteTasksByNoteId(noteId);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.noteId !== noteId),
    }));
  },

  getTasksByNoteId: (noteId) => {
    return get().tasks.filter((task) => task.noteId === noteId);
  },

  toggleTaskComplete: (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      const updatedTask = dbService.updateTask(id, { completed: !task.completed });
      if (updatedTask) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? updatedTask : t
          ),
        }));
      }
    }
  },

  // 一键生成待办 - 核心功能
  convertMarkdownToTasks: (markdown: string, noteId: string) => {
    // 1. 解析 Markdown 提取任务
    const parsedTasks = MarkdownParser.parseToTasks(markdown, noteId);
    
    if (parsedTasks.length === 0) {
      return 0;
    }
    
    // 2. 先删除该笔记之前的任务（避免重复）
    get().deleteTasksByNoteId(noteId);
    
    // 3. 批量插入新任务
    get().addTasks(parsedTasks);
    
    return parsedTasks.length;
  },
}));
