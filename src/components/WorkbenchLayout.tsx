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
    // 导航和笔记保留极窄区域（48px）
    if (config.collapseBehavior === 'narrow') {
      return (
        <div
          className="shrink-0 flex flex-col h-full bg-[var(--panel-bg)] border-r border-[var(--panel-border)] transition-all duration-300"
          style={{ width: config.collapsedWidth }}
        >
          {/* 展开按钮 - 显示编号 */}
          <button
            onClick={onToggle}
            className="w-full h-12 flex items-center justify-center hover:bg-primary/5 transition-colors group relative"
            title={config.title}
          >
            <span className="text-sm font-bold text-primary">
              {config.index}
            </span>
            {/* 悬停提示 */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {config.title}
            </span>
          </button>
          {/* 图标区域 */}
          <div className="flex-1 flex flex-col items-center py-2 gap-2">
            <span className="material-symbols-outlined text-lg text-[var(--text-secondary)]">{config.icon}</span>
          </div>
        </div>
      );
    }
    // 撰写、预览、任务完全隐藏
    return null;
  }

  // 展开状态
  return (
    <div
      className={`shrink-0 flex flex-col h-full bg-[var(--panel-bg)] border-r border-[var(--panel-border)] transition-all duration-300 ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
    >
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-2">
          {/* 编号 */}
          <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {config.index}
          </span>
          <span className="material-symbols-outlined text-sm text-[var(--text-secondary)]">{config.icon}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{config.title}</span>
        </div>

        {/* 折叠按钮 */}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="折叠"
        >
          <span className="material-symbols-outlined text-sm text-[var(--text-secondary)]">
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
    <div className="flex flex-1 h-full overflow-hidden bg-[var(--background-light)] dark:bg-[var(--background-dark)]">
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

      {/* 底部布局控制栏 */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-[var(--panel-bg)] border-t border-[var(--panel-border)] flex items-center justify-between px-4 z-50">
        {/* 左侧：数字控制按钮 */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((num) => {
            const key = Object.keys(defaultPanelConfigs).find(
              (k) => defaultPanelConfigs[k as PanelKey].index === num
            ) as PanelKey;
            const isActive = panels[key];
            return (
              <button
                key={num}
                onClick={() => togglePanel(key)}
                className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center text-sm font-bold ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={`${defaultPanelConfigs[key].title} (${num})`}
              >
                {num}
              </button>
            );
          })}
          <div className="w-px h-5 bg-[var(--panel-border)] mx-2" />
          <button
            onClick={resetLayout}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[var(--text-secondary)]"
            title="恢复默认布局"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {/* 右侧：状态信息 */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            系统同步中
          </span>
          <span>快捷键指南</span>
        </div>
      </div>
    </div>
  );
}
