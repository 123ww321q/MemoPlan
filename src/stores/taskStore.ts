import { create } from 'zustand';
import { Task } from '../types';
import { dbService, initDatabase } from '../services/dbService';
import { MarkdownParser } from '../services/markdownParser';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadTasksByNoteId: (noteId: string) => Promise<Task[]>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteTasksByNoteId: (noteId: string) => Promise<void>;
  getTasksByNoteId: (noteId: string) => Task[];
  toggleTaskComplete: (id: string) => Promise<void>;
  // 一键生成待办
  convertMarkdownToTasks: (markdown: string, noteId: string) => Promise<number>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    await initDatabase();
    await get().loadTasks();
    set({ initialized: true });
  },

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await dbService.getTasks();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTasksByNoteId: async (noteId: string) => {
    try {
      return await dbService.getTasksByNoteId(noteId);
    } catch (error) {
      console.error('Failed to load tasks by noteId:', error);
      return [];
    }
  },

  addTask: async (task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await dbService.addTask(newTask);
      set((state) => ({ tasks: [...state.tasks, newTask] }));
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  },

  addTasks: async (newTasks) => {
    const createdTasks: Task[] = [];
    
    for (const task of newTasks) {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      try {
        await dbService.addTask(newTask);
        createdTasks.push(newTask);
      } catch (error) {
        console.error('Failed to add task:', error);
      }
    }
    
    if (createdTasks.length > 0) {
      set((state) => ({ tasks: [...state.tasks, ...createdTasks] }));
    }
  },

  updateTask: async (id, updates) => {
    const { tasks } = get();
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    try {
      await dbService.updateTask(id, updatedTask);
      const newTasks = [...tasks];
      newTasks[taskIndex] = updatedTask;
      set({ tasks: newTasks });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      await dbService.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  },

  deleteTasksByNoteId: async (noteId: string) => {
    const tasksToDelete = get().tasks.filter(t => t.noteId === noteId);
    
    try {
      await Promise.all(tasksToDelete.map(t => dbService.deleteTask(t.id)));
      set((state) => ({
        tasks: state.tasks.filter((task) => task.noteId !== noteId),
      }));
    } catch (error) {
      console.error('Failed to delete tasks by noteId:', error);
    }
  },

  getTasksByNoteId: (noteId) => {
    return get().tasks.filter((task) => task.noteId === noteId);
  },

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      await get().updateTask(id, { completed: !task.completed });
    }
  },

  // 一键生成待办 - 核心功能
  convertMarkdownToTasks: async (markdown: string, noteId: string) => {
    // 1. 解析 Markdown 提取任务
    const parsedTasks = MarkdownParser.parseToTasks(markdown, noteId);
    
    if (parsedTasks.length === 0) {
      return 0;
    }
    
    // 2. 先删除该笔记之前的任务（避免重复）
    await get().deleteTasksByNoteId(noteId);
    
    // 3. 批量插入新任务
    await get().addTasks(parsedTasks);
    
    return parsedTasks.length;
  },
}));
