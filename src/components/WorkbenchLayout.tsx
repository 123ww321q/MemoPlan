import { ReactNode } from 'react';
import { useLayoutStore, PanelKey } from '../stores/layoutStore';
import CollapsiblePanel from './CollapsiblePanel';

interface WorkbenchLayoutProps {
  navigation: ReactNode;    // 左侧导航+笔记列表（合并）
  editor: ReactNode;        // 编辑器（撰写）
  preview: ReactNode;       // 预览
  taskPanel: ReactNode;     // 右侧任务
}

export default function WorkbenchLayout({
  navigation,
  editor,
  preview,
  taskPanel,
}: WorkbenchLayoutProps) {
  const {
    panels,
    panelWidths,
    togglePanel,
    setPanelWidth,
    resetLayout,
  } = useLayoutStore();

  // 渲染面板
  const renderPanel = (panelKey: PanelKey, content: ReactNode, showResize = true) => (
    <CollapsiblePanel
      panelKey={panelKey}
      isOpen={panels[panelKey]}
      width={panelWidths[panelKey]}
      onToggle={() => togglePanel(panelKey)}
      onResize={(width) => setPanelWidth(panelKey, width)}
      showResizeHandle={showResize}
    >
      {content}
    </CollapsiblePanel>
  );

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* 1. 左侧导航+笔记列表 */}
      {renderPanel('navigation', navigation)}

      {/* 2. 编辑器（撰写） */}
      {renderPanel('editor', editor)}

      {/* 3. 预览 */}
      {renderPanel('preview', preview)}

      {/* 4. 右侧任务面板 */}
      {renderPanel('taskPanel', taskPanel)}

      {/* 布局控制条 - 悬浮在左下角 */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {/* 面板切换按钮组 */}
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1.5">
          {/* 1 - 导航 */}
          <button
            onClick={() => togglePanel('navigation')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
              panels.navigation
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="导航 (1)"
          >
            <span className="text-xs font-bold">1</span>
          </button>

          {/* 2 - 撰写 */}
          <button
            onClick={() => togglePanel('editor')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
              panels.editor
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="撰写 (2)"
          >
            <span className="text-xs font-bold">2</span>
          </button>

          {/* 3 - 预览 */}
          <button
            onClick={() => togglePanel('preview')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
              panels.preview
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="预览 (3)"
          >
            <span className="text-xs font-bold">3</span>
          </button>

          {/* 4 - 任务 */}
          <button
            onClick={() => togglePanel('taskPanel')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
              panels.taskPanel
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="任务 (4)"
          >
            <span className="text-xs font-bold">4</span>
          </button>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* 重置布局 */}
          <button
            onClick={resetLayout}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-500"
            title="恢复默认布局"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {/* 快捷键提示 */}
        <div className="text-[10px] text-slate-400 px-2 opacity-0 hover:opacity-100 transition-opacity">
          点击数字键 1-4 快速切换面板
        </div>
      </div>
    </div>
  );
}
