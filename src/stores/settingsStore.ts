import { create } from 'zustand';
import { AppSettings, ThemeColor } from '../types';
import { dbService } from '../services/dbService';

const defaultSettings: AppSettings = {
  general: {
    autoStart: false,
    minimizeToTray: true,
    closeToTray: false,
    confirmDelete: true,
    autoSave: true,
    autoSaveInterval: 3,
  },
  appearance: {
    theme: 'light',
    themeColor: 'orange',
    backgroundBlur: 0,
    backgroundOpacity: 100,
    backgroundMode: 'fill',
    sidebarVisible: true,
    noteListVisible: true,
    taskPanelVisible: true,
    sidebarCollapsed: false,
    noteListCollapsed: false,
    taskPanelCollapsed: false,
  },
  language: 'zh-CN',
  editor: {
    fontSize: 14,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    previewMode: 'side',
    defaultTextColor: '#1e293b',
    defaultBackgroundColor: '#ffffff',
    showLineNumbers: false,
    wordWrap: true,
  },
  taskRules: {
    autoConvert: true,
    detectCheckbox: true,
    detectList: false,
    detectHeading: true,
    smartDateDetection: false,
  },
  export: {
    defaultFormat: 'md',
    includeMetadata: true,
    includeTags: true,
  },
  import: {
    supportedFormats: ['.md', '.txt', '.json', '.html'],
    preserveDates: true,
  },
};

// 主题颜色配置
export const themeColors: Record<ThemeColor, { primary: string; light: string; dark: string; name: string }> = {
  orange: { primary: '#ec5b13', light: '#fff7ed', dark: '#7c2d12', name: '活力橙' },
  blue: { primary: '#3b82f6', light: '#eff6ff', dark: '#1e3a8a', name: '天空蓝' },
  green: { primary: '#10b981', light: '#ecfdf5', dark: '#064e3b', name: '清新绿' },
  purple: { primary: '#8b5cf6', light: '#f5f3ff', dark: '#4c1d95', name: '优雅紫' },
  pink: { primary: '#ec4899', light: '#fdf2f8', dark: '#831843', name: '浪漫粉' },
  red: { primary: '#ef4444', light: '#fef2f2', dark: '#7f1d1d', name: '热情红' },
  cyan: { primary: '#06b6d4', light: '#ecfeff', dark: '#164e63', name: '青柠青' },
  indigo: { primary: '#6366f1', light: '#eef2ff', dark: '#312e81', name: '深邃靛' },
};

interface SettingsStore {
  settings: AppSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateGeneralSettings: (general: Partial<AppSettings['general']>) => Promise<void>;
  updateAppearanceSettings: (appearance: Partial<AppSettings['appearance']>) => Promise<void>;
  updateEditorSettings: (editor: Partial<AppSettings['editor']>) => Promise<void>;
  updateTaskRules: (taskRules: Partial<AppSettings['taskRules']>) => Promise<void>;
  updateExportSettings: (export_: Partial<AppSettings['export']>) => Promise<void>;
  updateImportSettings: (import_: Partial<AppSettings['import']>) => Promise<void>;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  toggleSidebar: () => Promise<void>;
  toggleNoteList: () => Promise<void>;
  toggleTaskPanel: () => Promise<void>;
  toggleSidebarCollapsed: () => Promise<void>;
  toggleNoteListCollapsed: () => Promise<void>;
  toggleTaskPanelCollapsed: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SETTINGS_KEY = 'app_settings';

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,

  loadSettings: async () => {
    try {
      const stored = await dbService.getSetting(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ settings: { ...defaultSettings, ...parsed } });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  updateGeneralSettings: async (general) => {
    const updated = { ...get().settings, general: { ...get().settings.general, ...general } };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  updateAppearanceSettings: async (appearance) => {
    const updated = { ...get().settings, appearance: { ...get().settings.appearance, ...appearance } };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  updateEditorSettings: async (editor) => {
    const updated = { ...get().settings, editor: { ...get().settings.editor, ...editor } };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  updateTaskRules: async (taskRules) => {
    const updated = { ...get().settings, taskRules: { ...get().settings.taskRules, ...taskRules } };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  updateExportSettings: async (export_) => {
    const updated = { ...get().settings, export: { ...get().settings.export, ...export_ } };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  updateImportSettings: async (import_) => {
    const updated = { ...get().settings, import: { ...get().settings.import, ...import_ } };
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  setThemeColor: async (color) => {
    await get().updateAppearanceSettings({ themeColor: color });
  },

  setTheme: async (theme) => {
    await get().updateAppearanceSettings({ theme });
  },

  toggleSidebar: async () => {
    const { settings } = get();
    await get().updateAppearanceSettings({ sidebarVisible: !settings.appearance.sidebarVisible });
  },

  toggleNoteList: async () => {
    const { settings } = get();
    await get().updateAppearanceSettings({ noteListVisible: !settings.appearance.noteListVisible });
  },

  toggleTaskPanel: async () => {
    const { settings } = get();
    await get().updateAppearanceSettings({ taskPanelVisible: !settings.appearance.taskPanelVisible });
  },

  toggleSidebarCollapsed: async () => {
    const { settings } = get();
    await get().updateAppearanceSettings({ sidebarCollapsed: !settings.appearance.sidebarCollapsed });
  },

  toggleNoteListCollapsed: async () => {
    const { settings } = get();
    await get().updateAppearanceSettings({ noteListCollapsed: !settings.appearance.noteListCollapsed });
  },

  toggleTaskPanelCollapsed: async () => {
    const { settings } = get();
    await get().updateAppearanceSettings({ taskPanelCollapsed: !settings.appearance.taskPanelCollapsed });
  },

  resetSettings: async () => {
    try {
      await dbService.setSetting(SETTINGS_KEY, JSON.stringify(defaultSettings));
      set({ settings: defaultSettings });
    } catch (error) {
      console.error('重置设置失败:', error);
    }
  },
}));
