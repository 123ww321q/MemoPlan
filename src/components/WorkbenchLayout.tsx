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
  onResize,
}: {
  panelKey: PanelKey;
  children: ReactNode;
  width: number;
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

  return (
    <div
      className={`shrink-0 flex flex-col h-full bg-[var(--panel-bg)] border-r border-[var(--panel-border)] transition-all duration-300 ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
    >
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-2 h-8 border-b border-[var(--panel-border)] bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
            {config.index}
          </span>
          <span className="material-symbols-outlined text-xs text-[var(--text-secondary)]">{config.icon}</span>
          <span className="text-xs font-medium text-[var(--text-primary)]">{config.title}</span>
        </div>
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
  const { panelWidths, setPanelWidth } = useLayoutStore();

  const renderPanel = (panelKey: PanelKey, content: ReactNode) => (
    <ResizablePanel
      key={panelKey}
      panelKey={panelKey}
      width={panelWidths[panelKey]}
      onResize={(width) => setPanelWidth(panelKey, width)}
    >
      {content}
    </ResizablePanel>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[var(--background-light)] dark:bg-[var(--background-dark)]">
      {/* 1. 导航 - 变窄 */}
      {renderPanel('navigation', navigation)}

      {/* 2. 笔记列表 - 变窄 */}
      {renderPanel('noteList', noteList)}

      {/* 3. 撰写 - 主要区域 */}
      {renderPanel('editor', editor)}

      {/* 4. 预览 */}
      {renderPanel('preview', preview)}

      {/* 5. 任务 - 变窄 */}
      {renderPanel('taskPanel', taskPanel)}
    </div>
  );
}
