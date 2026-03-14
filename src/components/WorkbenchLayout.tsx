import { ReactNode, useRef, useState, useCallback } from 'react';
import { useLayoutStore, PanelKey, defaultPanelConfigs } from '../stores/layoutStore';

interface WorkbenchLayoutProps {
  navigation: ReactNode;
  noteList: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  taskPanel: ReactNode;
}

// 可拖拽调整大小的面板
function ResizablePanel({
  panelKey,
  children,
  width,
  isOpen,
  onToggle,
  onResize,
}: {
  panelKey: PanelKey;
  children: ReactNode;
  width: number;
  isOpen: boolean;
  onToggle: () => void;
  onResize: (width: number) => void;
}) {
  const config = defaultPanelConfigs[panelKey];
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = config.position === 'right'
        ? startXRef.current - e.clientX
        : e.clientX - startXRef.current;
      const newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidthRef.current + delta));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, config, onResize]);

  // 折叠状态
  if (!isOpen) {
    // 导航和笔记保留细窄区域
    if (config.collapseBehavior === 'narrow') {
      return (
        <div
          className="shrink-0 flex flex-col bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 transition-all duration-300"
          style={{ width: config.collapsedWidth }}
        >
          <button
            onClick={onToggle}
            className="w-full h-12 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative"
            title={config.title}
          >
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
              {config.index}
            </span>
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {config.title}
            </span>
          </button>
          <div className="flex-1 flex flex-col items-center py-2">
            <span className="material-symbols-outlined text-lg text-slate-400">{config.icon}</span>
          </div>
        </div>
      );
    }
    // 其他面板完全隐藏
    return null;
  }

  // 展开状态
  return (
    <div
      className={`shrink-0 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
    >
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {config.index}
          </span>
          <span className="material-symbols-outlined text-sm text-slate-500">{config.icon}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{config.title}</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="折叠"
        >
          <span className="material-symbols-outlined text-sm text-slate-500">
            {config.position === 'right' ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* 调整大小手柄 */}
      <div
        className={`absolute top-0 ${config.position === 'right' ? 'left-0' : 'right-0'} w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors ${isResizing ? 'bg-primary' : ''}`}
        onMouseDown={handleResizeStart}
        title="拖拽调整宽度"
      />
    </div>
  );
}

export default function WorkbenchLayout({
  navigation,
  noteList,
  editor,
  preview,
  taskPanel,
}: WorkbenchLayoutProps) {
  const { panels, panelWidths, togglePanel, setPanelWidth, resetLayout } = useLayoutStore();

  const renderPanel = (panelKey: PanelKey, content: ReactNode) => (
    <ResizablePanel
      key={panelKey}
      panelKey={panelKey}
      isOpen={panels[panelKey]}
      width={panelWidths[panelKey]}
      onToggle={() => togglePanel(panelKey)}
      onResize={(width) => setPanelWidth(panelKey, width)}
    >
      {content}
    </ResizablePanel>
  );

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* 1. 导航 */}
      {renderPanel('navigation', navigation)}

      {/* 2. 笔记列表 */}
      {renderPanel('noteList', noteList)}

      {/* 3. 撰写 */}
      {renderPanel('editor', editor)}

      {/* 4. 预览 */}
      {renderPanel('preview', preview)}

      {/* 5. 任务 */}
      {renderPanel('taskPanel', taskPanel)}

      {/* 布局控制条 - 左下角 */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1.5">
          {[1, 2, 3, 4, 5].map((num) => {
            const key = Object.keys(defaultPanelConfigs).find(
              (k) => defaultPanelConfigs[k as PanelKey].index === num
            ) as PanelKey;
            const isActive = panels[key];
            return (
              <button
                key={num}
                onClick={() => togglePanel(key)}
                className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                title={`${defaultPanelConfigs[key].title} (${num})`}
              >
                <span className="text-xs font-bold">{num}</span>
              </button>
            );
          })}
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />
          <button
            onClick={resetLayout}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-500"
            title="恢复默认布局"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
