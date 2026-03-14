import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 可折叠区域类型
export type PanelKey = 
  | 'leftSidebar'    // 左侧主导航栏
  | 'noteList'       // 笔记列表区
  | 'editor'         // 编辑器区
  | 'preview'        // 预览区
  | 'taskPanel';     // 右侧任务区

// 面板配置
export interface PanelConfig {
  width: number;        // 展开时的宽度
  minWidth: number;     // 最小宽度
  maxWidth: number;     // 最大宽度
  collapsedWidth: number; // 折叠后的宽度
  icon: string;         // 折叠后显示的图标
  title: string;        // 面板标题
  position: 'left' | 'right' | 'center'; // 位置
}

// 默认面板配置
export const defaultPanelConfigs: Record<PanelKey, PanelConfig> = {
  leftSidebar: {
    width: 200,
    minWidth: 160,
    maxWidth: 280,
    collapsedWidth: 56,
    icon: 'menu',
    title: '导航',
    position: 'left',
  },
  noteList: {
    width: 280,
    minWidth: 220,
    maxWidth: 400,
    collapsedWidth: 56,
    icon: 'list',
    title: '笔记列表',
    position: 'left',
  },
  editor: {
    width: 500,
    minWidth: 300,
    maxWidth: 800,
    collapsedWidth: 0,
    icon: 'edit',
    title: '编辑器',
    position: 'center',
  },
  preview: {
    width: 500,
    minWidth: 300,
    maxWidth: 800,
    collapsedWidth: 0,
    icon: 'preview',
    title: '预览',
    position: 'center',
  },
  taskPanel: {
    width: 320,
    minWidth: 260,
    maxWidth: 450,
    collapsedWidth: 56,
    icon: 'task_alt',
    title: '任务',
    position: 'right',
  },
};

// 布局状态接口
interface LayoutState {
  // 面板展开状态 (true=展开, false=折叠)
  panels: Record<PanelKey, boolean>;
  
  // 面板宽度配置
  panelWidths: Record<PanelKey, number>;
  
  // 操作函数
  togglePanel: (key: PanelKey) => void;
  openPanel: (key: PanelKey) => void;
  closePanel: (key: PanelKey) => void;
  setPanelWidth: (key: PanelKey, width: number) => void;
  resetLayout: () => void;
  
  // 批量操作
  openAllPanels: () => void;
  closeAllPanels: () => void;
  
  // 获取面板状态
  isPanelOpen: (key: PanelKey) => boolean;
  getPanelWidth: (key: PanelKey) => number;
}

// 默认布局状态
const defaultPanels: Record<PanelKey, boolean> = {
  leftSidebar: true,
  noteList: true,
  editor: true,
  preview: true,
  taskPanel: true,
};

// 创建布局状态管理
export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // 初始状态
      panels: { ...defaultPanels },
      panelWidths: {
        leftSidebar: defaultPanelConfigs.leftSidebar.width,
        noteList: defaultPanelConfigs.noteList.width,
        editor: defaultPanelConfigs.editor.width,
        preview: defaultPanelConfigs.preview.width,
        taskPanel: defaultPanelConfigs.taskPanel.width,
      },

      // 切换面板状态
      togglePanel: (key: PanelKey) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [key]: !state.panels[key],
          },
        }));
      },

      // 打开面板
      openPanel: (key: PanelKey) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [key]: true,
          },
        }));
      },

      // 关闭面板
      closePanel: (key: PanelKey) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [key]: false,
          },
        }));
      },

      // 设置面板宽度
      setPanelWidth: (key: PanelKey, width: number) => {
        const config = defaultPanelConfigs[key];
        const clampedWidth = Math.max(config.minWidth, Math.min(config.maxWidth, width));
        set((state) => ({
          panelWidths: {
            ...state.panelWidths,
            [key]: clampedWidth,
          },
        }));
      },

      // 重置布局
      resetLayout: () => {
        set({
          panels: { ...defaultPanels },
          panelWidths: {
            leftSidebar: defaultPanelConfigs.leftSidebar.width,
            noteList: defaultPanelConfigs.noteList.width,
            editor: defaultPanelConfigs.editor.width,
            preview: defaultPanelConfigs.preview.width,
            taskPanel: defaultPanelConfigs.taskPanel.width,
          },
        });
      },

      // 打开所有面板
      openAllPanels: () => {
        set((state) => ({
          panels: Object.keys(state.panels).reduce((acc, key) => {
            acc[key as PanelKey] = true;
            return acc;
          }, {} as Record<PanelKey, boolean>),
        }));
      },

      // 关闭所有面板
      closeAllPanels: () => {
        set((state) => ({
          panels: Object.keys(state.panels).reduce((acc, key) => {
            acc[key as PanelKey] = false;
            return acc;
          }, {} as Record<PanelKey, boolean>),
        }));
      },

      // 获取面板状态
      isPanelOpen: (key: PanelKey) => {
        return get().panels[key];
      },

      // 获取面板宽度
      getPanelWidth: (key: PanelKey) => {
        const state = get();
        if (state.panels[key]) {
          return state.panelWidths[key];
        }
        return defaultPanelConfigs[key].collapsedWidth;
      },
    }),
    {
      name: 'memoplan-layout-storage',
      partialize: (state) => ({
        panels: state.panels,
        panelWidths: state.panelWidths,
      }),
    }
  )
);

export default useLayoutStore;
