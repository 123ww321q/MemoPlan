import { create } from 'zustand';
import { AppSettings, ThemeColor } from '../types';

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
  loadSettings: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateGeneralSettings: (general: Partial<AppSettings['general']>) => void;
  updateAppearanceSettings: (appearance: Partial<AppSettings['appearance']>) => void;
  updateEditorSettings: (editor: Partial<AppSettings['editor']>) => void;
  updateTaskRules: (taskRules: Partial<AppSettings['taskRules']>) => void;
  updateExportSettings: (export_: Partial<AppSettings['export']>) => void;
  updateImportSettings: (import_: Partial<AppSettings['import']>) => void;
  setThemeColor: (color: ThemeColor) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  toggleNoteList: () => void;
  toggleTaskPanel: () => void;
  toggleSidebarCollapsed: () => void;
  toggleNoteListCollapsed: () => void;
  toggleTaskPanelCollapsed: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,

  loadSettings: () => {
    try {
      const stored = localStorage.getItem('memoplan_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ settings: { ...defaultSettings, ...parsed } });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateGeneralSettings: (general) => {
    set((state) => {
      const updated = { ...state.settings, general: { ...state.settings.general, ...general } };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateAppearanceSettings: (appearance) => {
    set((state) => {
      const updated = { ...state.settings, appearance: { ...state.settings.appearance, ...appearance } };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateEditorSettings: (editor) => {
    set((state) => {
      const updated = { ...state.settings, editor: { ...state.settings.editor, ...editor } };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateTaskRules: (taskRules) => {
    set((state) => {
      const updated = { ...state.settings, taskRules: { ...state.settings.taskRules, ...taskRules } };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateExportSettings: (export_) => {
    set((state) => {
      const updated = { ...state.settings, export: { ...state.settings.export, ...export_ } };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  updateImportSettings: (import_) => {
    set((state) => {
      const updated = { ...state.settings, import: { ...state.settings.import, ...import_ } };
      localStorage.setItem('memoplan_settings', JSON.stringify(updated));
      return { settings: updated };
    });
  },

  setThemeColor: (color) => {
    get().updateAppearanceSettings({ themeColor: color });
  },

  setTheme: (theme) => {
    get().updateAppearanceSettings({ theme });
  },

  toggleSidebar: () => {
    const { settings } = get();
    get().updateAppearanceSettings({ sidebarVisible: !settings.appearance.sidebarVisible });
  },

  toggleNoteList: () => {
    const { settings } = get();
    get().updateAppearanceSettings({ noteListVisible: !settings.appearance.noteListVisible });
  },

  toggleTaskPanel: () => {
    const { settings } = get();
    get().updateAppearanceSettings({ taskPanelVisible: !settings.appearance.taskPanelVisible });
  },

  toggleSidebarCollapsed: () => {
    const { settings } = get();
    get().updateAppearanceSettings({ sidebarCollapsed: !settings.appearance.sidebarCollapsed });
  },

  toggleNoteListCollapsed: () => {
    const { settings } = get();
    get().updateAppearanceSettings({ noteListCollapsed: !settings.appearance.noteListCollapsed });
  },

  toggleTaskPanelCollapsed: () => {
    const { settings } = get();
    get().updateAppearanceSettings({ taskPanelCollapsed: !settings.appearance.taskPanelCollapsed });
  },

  resetSettings: () => {
    localStorage.setItem('memoplan_settings', JSON.stringify(defaultSettings));
    set({ settings: defaultSettings });
  },
}));
