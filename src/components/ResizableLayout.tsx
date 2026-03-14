import { useState, ReactNode } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface ResizableLayoutProps {
  sidebar: ReactNode;
  noteList: ReactNode;
  editor: ReactNode;
  taskPanel: ReactNode;
}

export default function ResizableLayout({ sidebar, noteList, editor, taskPanel }: ResizableLayoutProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!settings.appearance.sidebarVisible);
  const [noteListCollapsed, setNoteListCollapsed] = useState(!settings.appearance.noteListVisible);
  const [taskPanelCollapsed, setTaskPanelCollapsed] = useState(!settings.appearance.taskPanelVisible);

  // 面板宽度配置
  const sidebarWidth = 200;
  const noteListWidth = 280;
  const taskPanelWidth = 320;

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(true);
    updateSettings({ appearance: { ...settings.appearance, sidebarVisible: false } });
  };

  const handleSidebarExpand = () => {
    setSidebarCollapsed(false);
    updateSettings({ appearance: { ...settings.appearance, sidebarVisible: true } });
  };

  const handleNoteListCollapse = () => {
    setNoteListCollapsed(true);
    updateSettings({ appearance: { ...settings.appearance, noteListVisible: false } });
  };

  const handleNoteListExpand = () => {
    setNoteListCollapsed(false);
    updateSettings({ appearance: { ...settings.appearance, noteListVisible: true } });
  };

  const handleTaskPanelCollapse = () => {
    setTaskPanelCollapsed(true);
    updateSettings({ appearance: { ...settings.appearance, taskPanelVisible: false } });
  };

  const handleTaskPanelExpand = () => {
    setTaskPanelCollapsed(false);
    updateSettings({ appearance: { ...settings.appearance, taskPanelVisible: true } });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧边栏 - 可折叠 */}
      {sidebarCollapsed ? (
        <div
          className="shrink-0 flex flex-col items-center py-4 bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-700 w-14 transition-all duration-300"
          title="导航"
        >
          <button
            onClick={handleSidebarExpand}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-2xl text-primary">menu</span>
          </button>
          {/* 折叠状态下显示主要图标 */}
          <div className="flex flex-col gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="全部笔记">
              <span className="material-symbols-outlined text-xl">description</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="今日任务">
              <span className="material-symbols-outlined text-xl">today</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="收藏">
              <span className="material-symbols-outlined text-xl">star</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="shrink-0 flex flex-col bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-700 transition-all duration-300"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* 折叠按钮 */}
          <div className="flex items-center justify-end px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSidebarCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="折叠侧边栏"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
          </div>
          {/* 侧边栏内容 */}
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>
        </div>
      )}

      {/* 笔记列表 - 可折叠 */}
      {noteListCollapsed ? (
        <div
          className="shrink-0 flex flex-col items-center py-4 bg-slate-50/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700 w-14 transition-all duration-300"
          title="笔记列表"
        >
          <button
            onClick={handleNoteListExpand}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl text-primary">list</span>
          </button>
          <span className="text-[10px] text-slate-500 mt-1">笔记</span>
        </div>
      ) : (
        <div
          className="shrink-0 flex flex-col bg-slate-50/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700 transition-all duration-300"
          style={{ width: `${noteListWidth}px`, minWidth: '240px', maxWidth: '400px' }}
        >
          {/* 折叠按钮 */}
          <div className="flex items-center justify-end px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleNoteListCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="折叠笔记列表"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
          </div>
          {/* 笔记列表内容 */}
          <div className="flex-1 overflow-y-auto">
            {noteList}
          </div>
        </div>
      )}

      {/* 中间编辑器区域 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-slate-900/50">
        {editor}
      </div>

      {/* 右侧任务面板 - 可折叠 */}
      {taskPanelCollapsed ? (
        <div
          className="shrink-0 flex flex-col items-center py-4 bg-slate-50/60 dark:bg-slate-900/60 border-l border-slate-200 dark:border-slate-700 w-14 transition-all duration-300"
          title="任务面板"
        >
          <button
            onClick={handleTaskPanelExpand}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl text-primary">task_alt</span>
          </button>
          <span className="text-[10px] text-slate-500 mt-1">任务</span>
        </div>
      ) : (
        <div
          className="shrink-0 flex flex-col bg-slate-50/60 dark:bg-slate-900/60 border-l border-slate-200 dark:border-slate-700 transition-all duration-300"
          style={{ width: `${taskPanelWidth}px`, minWidth: '280px', maxWidth: '450px' }}
        >
          {/* 折叠按钮 */}
          <div className="flex items-center justify-start px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleTaskPanelCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="折叠任务面板"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          {/* 任务面板内容 */}
          <div className="flex-1 overflow-y-auto">
            {taskPanel}
          </div>
        </div>
      )}
    </div>
  );
}
