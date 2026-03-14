import { Note, Task, AppSettings, Template } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 使用 LocalStorage 作为数据存储（简化版本，后续可迁移到 SQLite）
const STORAGE_KEYS = {
  NOTES: 'memoplan_notes',
  TASKS: 'memoplan_tasks',
  SETTINGS: 'memoplan_settings',
  TEMPLATES: 'memoplan_templates',
};

// 数据库服务
export const dbService = {
  // 初始化
  init: async (): Promise<void> => {
    // 初始化默认模板
    const templates = dbService.getTemplates();
    if (templates.length === 0) {
      dbService.initDefaultTemplates();
    }
  },

  // Notes 操作
  getNotes: (): Note[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  },

  saveNotes: (notes: Note[]): void => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const notes = dbService.getNotes();
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    notes.unshift(newNote);
    dbService.saveNotes(notes);
    return newNote;
  },

  updateNote: (id: string, updates: Partial<Note>): Note | null => {
    const notes = dbService.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    
    notes[index] = { ...notes[index], ...updates, updatedAt: Date.now() };
    dbService.saveNotes(notes);
    return notes[index];
  },

  deleteNote: (id: string): void => {
    const notes = dbService.getNotes().filter(n => n.id !== id);
    dbService.saveNotes(notes);
    // 同时删除相关任务
    const tasks = dbService.getTasks().filter(t => t.noteId !== id);
    dbService.saveTasks(tasks);
  },

  // Tasks 操作
  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  },

  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const tasks = dbService.getTasks();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(newTask);
    dbService.saveTasks(tasks);
    return newTask;
  },

  addTasks: (newTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Task[] => {
    const tasks = dbService.getTasks();
    const createdTasks: Task[] = newTasks.map(task => ({
      ...task,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    tasks.push(...createdTasks);
    dbService.saveTasks(tasks);
    return createdTasks;
  },

  updateTask: (id: string, updates: Partial<Task>): Task | null => {
    const tasks = dbService.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
    dbService.saveTasks(tasks);
    return tasks[index];
  },

  deleteTask: (id: string): void => {
    const tasks = dbService.getTasks().filter(t => t.id !== id);
    dbService.saveTasks(tasks);
  },

  deleteTasksByNoteId: (noteId: string): void => {
    const tasks = dbService.getTasks().filter(t => t.noteId !== noteId);
    dbService.saveTasks(tasks);
  },

  getTasksByNoteId: (noteId: string): Task[] => {
    return dbService.getTasks().filter(t => t.noteId === noteId);
  },

  // Settings 操作
  getSettings: (): AppSettings | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Templates 操作
  getTemplates: (): Template[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  },

  saveTemplates: (templates: Template[]): void => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  initDefaultTemplates: (): void => {
    const templates: Template[] = [
      {
        id: 'template-study-plan',
        name: '学习计划',
        nameI18n: { 'zh-CN': '学习计划', 'zh-TW': '學習計劃', 'en': 'Study Plan' },
        content: `# 学习计划

## 目标
- [ ] 明确学习目标

## 时间安排
- [ ] 第一周：基础知识
- [ ] 第二周：进阶内容
- [ ] 第三周：实践项目

## 复习计划
- [ ] 每日复习
- [ ] 每周总结
`,
        category: 'study',
        icon: 'menu_book',
      },
      {
        id: 'template-work-list',
        name: '工作清单',
        nameI18n: { 'zh-CN': '工作清单', 'zh-TW': '工作清單', 'en': 'Work List' },
        content: `# 工作清单

## 今日任务
- [ ] 任务 1
- [ ] 任务 2
- [ ] 任务 3

## 本周计划
- [ ] 项目 A
- [ ] 项目 B

## 待跟进
- [ ] 跟进事项 1
`,
        category: 'work',
        icon: 'work',
      },
      {
        id: 'template-reading-notes',
        name: '读书笔记',
        nameI18n: { 'zh-CN': '读书笔记', 'zh-TW': '讀書筆記', 'en': 'Reading Notes' },
        content: `# 读书笔记

## 书籍信息
- 书名：
- 作者：
- 阅读日期：

## 核心观点
- 

## 行动清单
- [ ] 行动 1
- [ ] 行动 2
`,
        category: 'study',
        icon: 'book',
      },
    ];
    dbService.saveTemplates(templates);
  },
};

// 兼容旧接口
export const initDatabase = dbService.init;
export const getDb = () => dbService;
