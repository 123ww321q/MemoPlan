import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 5个区域：导航、笔记、撰写、预览、任务
export type PanelKey = 
  | 'navigation'     // 1. 左侧导航
  | 'noteList'       // 2. 笔记列表
  | 'editor'         // 3. 撰写
  | 'preview'        // 4. 预览
  | 'taskPanel';     // 5. 任务

// 面板配置
export interface PanelConfig {
  index: number;
  width: number;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
  icon: string;
  title: string;
  position: 'left' | 'center' | 'right';
  collapseBehavior: 'narrow' | 'hide';
}

// 默认面板配置
export const defaultPanelConfigs: Record<PanelKey, PanelConfig> = {
  navigation: {
    index: 1,
    width: 200,
    minWidth: 160,
    maxWidth: 280,
    collapsedWidth: 48,
    icon: 'menu',
    title: '导航',
    position: 'left',
    collapseBehavior: 'narrow',
  },
  noteList: {
    index: 2,
    width: 280,
    minWidth: 220,
    maxWidth: 400,
    collapsedWidth: 48,
    icon: 'list',
    title: '笔记',
    position: 'left',
    collapseBehavior: 'narrow',
  },
  editor: {
    index: 3,
    width: 500,
    minWidth: 300,
    maxWidth: 800,
    collapsedWidth: 0,
    icon: 'edit',
    title: '撰写',
    position: 'center',
    collapseBehavior: 'hide',
  },
  preview: {
    index: 4,
    width: 500,
    minWidth: 300,
    maxWidth: 800,
    collapsedWidth: 0,
    icon: 'preview',
    title: '预览',
    position: 'center',
    collapseBehavior: 'hide',
  },
  taskPanel: {
    index: 5,
    width: 320,
    minWidth: 260,
    maxWidth: 450,
    collapsedWidth: 0,
    icon: 'task_alt',
    title: '任务',
    position: 'right',
    collapseBehavior: 'hide',
  },
};

interface LayoutState {
  panels: Record<PanelKey, boolean>;
  panelWidths: Record<PanelKey, number>;
  togglePanel: (key: PanelKey) => void;
  openPanel: (key: PanelKey) => void;
  closePanel: (key: PanelKey) => void;
  setPanelWidth: (key: PanelKey, width: number) => void;
  resetLayout: () => void;
  isPanelOpen: (key: PanelKey) => boolean;
  getPanelWidth: (key: PanelKey) => number;
}

const defaultPanels: Record<PanelKey, boolean> = {
  navigation: true,
  noteList: true,
  editor: true,
  preview: true,
  taskPanel: true,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      panels: { ...defaultPanels },
      panelWidths: {
        navigation: defaultPanelConfigs.navigation.width,
        noteList: defaultPanelConfigs.noteList.width,
        editor: defaultPanelConfigs.editor.width,
        preview: defaultPanelConfigs.preview.width,
        taskPanel: defaultPanelConfigs.taskPanel.width,
      },

      togglePanel: (key: PanelKey) => {
        set((state) => ({
          panels: { ...state.panels, [key]: !state.panels[key] },
        }));
      },

      openPanel: (key: PanelKey) => {
        set((state) => ({ panels: { ...state.panels, [key]: true } }));
      },

      closePanel: (key: PanelKey) => {
        set((state) => ({ panels: { ...state.panels, [key]: false } }));
      },

      setPanelWidth: (key: PanelKey, width: number) => {
        const config = defaultPanelConfigs[key];
        const clampedWidth = Math.max(config.minWidth, Math.min(config.maxWidth, width));
        set((state) => ({
          panelWidths: { ...state.panelWidths, [key]: clampedWidth },
        }));
      },

      resetLayout: () => {
        set({
          panels: { ...defaultPanels },
          panelWidths: {
            navigation: defaultPanelConfigs.navigation.width,
            noteList: defaultPanelConfigs.noteList.width,
            editor: defaultPanelConfigs.editor.width,
            preview: defaultPanelConfigs.preview.width,
            taskPanel: defaultPanelConfigs.taskPanel.width,
          },
        });
      },

      isPanelOpen: (key: PanelKey) => get().panels[key],

      getPanelWidth: (key: PanelKey) => {
        const state = get();
        const config = defaultPanelConfigs[key];
        if (state.panels[key]) {
          return state.panelWidths[key];
        }
        return config.collapsedWidth;
      },
    }),
    {
      name: 'memoplan-layout-storage',
      partialize: (state) => ({ panels: state.panels, panelWidths: state.panelWidths }),
    }
  )
);

export default useLayoutStore;
