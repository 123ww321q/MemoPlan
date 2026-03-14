export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  createdAt: number;
  updatedAt: number;
  category: 'notes' | 'study' | 'work' | 'tasks';
}

export interface Task {
  id: string;
  noteId: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: number;
  level: number;
  parentId?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type ThemeColor = 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'red' | 'cyan' | 'indigo';

export interface AppSettings {
  general: {
    autoStart: boolean;
    minimizeToTray: boolean;
    closeToTray: boolean;
    confirmDelete: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    themeColor: ThemeColor;
    backgroundImage?: string;
    backgroundBlur: number;
    backgroundOpacity: number;
    backgroundMode: 'fill' | 'fit' | 'center' | 'tile';
    sidebarVisible: boolean;
    noteListVisible: boolean;
    taskPanelVisible: boolean;
    sidebarCollapsed: boolean;
    noteListCollapsed: boolean;
    taskPanelCollapsed: boolean;
  };
  language: 'zh-CN' | 'zh-TW' | 'en';
  editor: {
    fontSize: number;
    fontFamily: string;
    previewMode: 'side' | 'preview' | 'edit';
    defaultTextColor: string;
    defaultBackgroundColor: string;
    showLineNumbers: boolean;
    wordWrap: boolean;
  };
  taskRules: {
    autoConvert: boolean;
    detectCheckbox: boolean;
    detectList: boolean;
    detectHeading: boolean;
    smartDateDetection: boolean;
  };
  export: {
    defaultFormat: 'md' | 'txt' | 'html' | 'json';
    includeMetadata: boolean;
    includeTags: boolean;
  };
  import: {
    supportedFormats: string[];
    preserveDates: boolean;
  };
}

export interface Template {
  id: string;
  name: string;
  nameI18n: Record<string, string>;
  content: string;
  category: string;
  icon: string;
}

export interface HistoryState {
  past: Note[][];
  present: Note[];
  future: Note[][];
}

export type ViewType = 'all' | 'today' | 'study' | 'favorites' | 'archive' | 'trash';

export interface NavItem {
  id: ViewType;
  icon: string;
  label: string;
  count?: number;
  visible: boolean;
}
