import { ReactNode } from 'react';
import { useLayoutStore, PanelKey } from '../stores/layoutStore';
import CollapsiblePanel from './CollapsiblePanel';

interface WorkbenchLayoutProps {
  leftSidebar: ReactNode;
  noteList: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  taskPanel: ReactNode;
}

export default function WorkbenchLayout({
  leftSidebar,
  noteList,
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
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧面板组 */}
      {renderPanel('leftSidebar', leftSidebar)}
      {renderPanel('noteList', noteList)}

      {/* 中间内容区 - 编辑器和预览 */}
      <div className="flex-1 flex min-w-0">
        {/* 编辑器 */}
        {panels.editor ? (
          <div 
            className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-slate-900/50"
            style={{ flex: panels.preview ? undefined : 1 }}
          >
            {editor}
          </div>
        ) : (
          <CollapsiblePanel
            panelKey="editor"
            isOpen={false}
            width={0}
            onToggle={() => togglePanel('editor')}
          >
            {null}
          </CollapsiblePanel>
        )}

        {/* 预览 */}
        {panels.preview ? (
          <div 
            className="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-slate-900/30 border-l border-slate-200 dark:border-slate-700"
            style={{ flex: panels.editor ? undefined : 1 }}
          >
            {preview}
          </div>
        ) : (
          <CollapsiblePanel
            panelKey="preview"
            isOpen={false}
            width={0}
            onToggle={() => togglePanel('preview')}
          >
            {null}
          </CollapsiblePanel>
        )}
      </div>

      {/* 右侧面板 */}
      {renderPanel('taskPanel', taskPanel)}

      {/* 布局控制条 - 悬浮在右上角 */}
      <div className="fixed top-14 right-4 z-40 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1">
        <button
          onClick={() => togglePanel('leftSidebar')}
          className={`p-1.5 rounded transition-colors ${panels.leftSidebar ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="切换导航栏"
        >
          <span className="material-symbols-outlined text-sm">menu</span>
        </button>
        <button
          onClick={() => togglePanel('noteList')}
          className={`p-1.5 rounded transition-colors ${panels.noteList ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="切换笔记列表"
        >
          <span className="material-symbols-outlined text-sm">list</span>
        </button>
        <button
          onClick={() => togglePanel('editor')}
          className={`p-1.5 rounded transition-colors ${panels.editor ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="切换编辑器"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
        <button
          onClick={() => togglePanel('preview')}
          className={`p-1.5 rounded transition-colors ${panels.preview ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="切换预览"
        >
          <span className="material-symbols-outlined text-sm">preview</span>
        </button>
        <button
          onClick={() => togglePanel('taskPanel')}
          className={`p-1.5 rounded transition-colors ${panels.taskPanel ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="切换任务面板"
        >
          <span className="material-symbols-outlined text-sm">task_alt</span>
        </button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          onClick={resetLayout}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="恢复默认布局"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>
    </div>
  );
}
