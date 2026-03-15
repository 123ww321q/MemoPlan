import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 5个区域：导航、笔记、撰写、预览、任务
export type PanelKey = 
  | 'navigation'     // 1. 左侧导航
  | 'noteList'       // 2. 笔记列表
  | 'editor'         // 3. 撰写
  | 'preview'        // 4. 预览
  | 'taskPanel';     // 5. 任务

// 面板状态（包含折叠信息）
export interface PanelState {
  width: number;
  collapsed: boolean;
  lastExpandedWidth: number;
}

// 面板配置
export interface PanelConfig {
  index: number;
  width: number;
  minWidth: number;
  maxWidth: number;
  icon: string;
  title: string;
  position: 'left' | 'center' | 'right';
}

// 折叠时的宽度
export const COLLAPSED_WIDTH = 60;

// 默认面板配置 - 调整宽度使布局更紧凑，中间区域更大
export const defaultPanelConfigs: Record<PanelKey, PanelConfig> = {
  navigation: {
    index: 1,
    width: 150,   // 左侧导航变窄
    minWidth: 120,
    maxWidth: 200,
    icon: 'menu',
    title: '导航',
    position: 'left',
  },
  noteList: {
    index: 2,
    width: 200,   // 笔记列表变窄
    minWidth: 160,
    maxWidth: 280,
    icon: 'list',
    title: '笔记',
    position: 'left',
  },
  editor: {
    index: 3,
    width: 550,   // 撰写区域
    minWidth: 400,
    maxWidth: 800,
    icon: 'edit',
    title: '撰写',
    position: 'center',
  },
  preview: {
    index: 4,
    width: 500,   // 预览区域
    minWidth: 350,
    maxWidth: 700,
    icon: 'visibility',
    title: '预览',
    position: 'center',
  },
  taskPanel: {
    index: 5,
    width: 180,   // 任务面板变窄
    minWidth: 140,
    maxWidth: 260,
    icon: 'task_alt',
    title: '任务',
    position: 'right',
  },
};

interface LayoutState {
  panelWidths: Record<PanelKey, number>;
  panelStates: Record<PanelKey, PanelState>;
  setPanelWidth: (key: PanelKey, width: number) => void;
  resetLayout: () => void;
  getPanelWidth: (key: PanelKey) => number;
  toggleCollapse: (key: PanelKey) => void;
  isPanelCollapsed: (key: PanelKey) => boolean;
  getActualWidth: (key: PanelKey) => number;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      panelWidths: {
        navigation: defaultPanelConfigs.navigation.width,
        noteList: defaultPanelConfigs.noteList.width,
        editor: defaultPanelConfigs.editor.width,
        preview: defaultPanelConfigs.preview.width,
        taskPanel: defaultPanelConfigs.taskPanel.width,
      },

      panelStates: {
        navigation: { width: defaultPanelConfigs.navigation.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.navigation.width },
        noteList: { width: defaultPanelConfigs.noteList.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.noteList.width },
        editor: { width: defaultPanelConfigs.editor.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.editor.width },
        preview: { width: defaultPanelConfigs.preview.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.preview.width },
        taskPanel: { width: defaultPanelConfigs.taskPanel.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.taskPanel.width },
      },

      setPanelWidth: (key: PanelKey, width: number) => {
        const config = defaultPanelConfigs[key];
        const clampedWidth = Math.max(config.minWidth, Math.min(config.maxWidth, width));
        set((state) => ({
          panelWidths: { ...state.panelWidths, [key]: clampedWidth },
          panelStates: { 
            ...state.panelStates, 
            [key]: { 
              ...state.panelStates[key], 
              width: clampedWidth,
              lastExpandedWidth: state.panelStates[key].collapsed ? state.panelStates[key].lastExpandedWidth : clampedWidth 
            } 
          },
        }));
      },

      resetLayout: () => {
        set({
          panelWidths: {
            navigation: defaultPanelConfigs.navigation.width,
            noteList: defaultPanelConfigs.noteList.width,
            editor: defaultPanelConfigs.editor.width,
            preview: defaultPanelConfigs.preview.width,
            taskPanel: defaultPanelConfigs.taskPanel.width,
          },
          panelStates: {
            navigation: { width: defaultPanelConfigs.navigation.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.navigation.width },
            noteList: { width: defaultPanelConfigs.noteList.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.noteList.width },
            editor: { width: defaultPanelConfigs.editor.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.editor.width },
            preview: { width: defaultPanelConfigs.preview.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.preview.width },
            taskPanel: { width: defaultPanelConfigs.taskPanel.width, collapsed: false, lastExpandedWidth: defaultPanelConfigs.taskPanel.width },
          },
        });
      },

      getPanelWidth: (key: PanelKey) => {
        return get().panelWidths[key];
      },

      toggleCollapse: (key: PanelKey) => {
        const state = get().panelStates[key];
        const newCollapsed = !state.collapsed;
        
        set((store) => ({
          panelStates: {
            ...store.panelStates,
            [key]: {
              ...state,
              collapsed: newCollapsed,
              width: newCollapsed ? COLLAPSED_WIDTH : state.lastExpandedWidth,
            },
          },
          panelWidths: {
            ...store.panelWidths,
            [key]: newCollapsed ? COLLAPSED_WIDTH : state.lastExpandedWidth,
          },
        }));
      },

      isPanelCollapsed: (key: PanelKey) => {
        return get().panelStates[key].collapsed;
      },

      getActualWidth: (key: PanelKey) => {
        const state = get().panelStates[key];
        return state.collapsed ? COLLAPSED_WIDTH : state.width;
      },
    }),
    {
      name: 'memoplan-layout-storage',
      partialize: (state) => ({ panelWidths: state.panelWidths, panelStates: state.panelStates }),
    }
  )
);

export default useLayoutStore;
