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
  icon: string;
  title: string;
  position: 'left' | 'center' | 'right';
}

// 默认面板配置 - 调整宽度使布局更紧凑
export const defaultPanelConfigs: Record<PanelKey, PanelConfig> = {
  navigation: {
    index: 1,
    width: 160,   // 变窄
    minWidth: 140,
    maxWidth: 200,
    icon: 'menu',
    title: '导航',
    position: 'left',
  },
  noteList: {
    index: 2,
    width: 220,   // 变窄
    minWidth: 180,
    maxWidth: 300,
    icon: 'list',
    title: '笔记',
    position: 'left',
  },
  editor: {
    index: 3,
    width: 600,   // 给撰写更多空间
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
    icon: 'preview',
    title: '预览',
    position: 'center',
  },
  taskPanel: {
    index: 5,
    width: 200,   // 变窄
    minWidth: 160,
    maxWidth: 280,
    icon: 'task_alt',
    title: '任务',
    position: 'right',
  },
};

interface LayoutState {
  panelWidths: Record<PanelKey, number>;
  setPanelWidth: (key: PanelKey, width: number) => void;
  resetLayout: () => void;
  getPanelWidth: (key: PanelKey) => number;
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

      setPanelWidth: (key: PanelKey, width: number) => {
        const config = defaultPanelConfigs[key];
        const clampedWidth = Math.max(config.minWidth, Math.min(config.maxWidth, width));
        set((state) => ({
          panelWidths: { ...state.panelWidths, [key]: clampedWidth },
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
        });
      },

      getPanelWidth: (key: PanelKey) => {
        return get().panelWidths[key];
      },
    }),
    {
      name: 'memoplan-layout-storage',
      partialize: (state) => ({ panelWidths: state.panelWidths }),
    }
  )
);

export default useLayoutStore;
