import { ReactNode, useRef, useState, useCallback } from 'react';
import { PanelKey, defaultPanelConfigs } from '../stores/layoutStore';

interface CollapsiblePanelProps {
  panelKey: PanelKey;
  isOpen: boolean;
  width: number;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  showResizeHandle?: boolean;
  onResize?: (newWidth: number) => void;
}

export default function CollapsiblePanel({
  panelKey,
  isOpen,
  width,
  onToggle,
  children,
  className = '',
  showResizeHandle = true,
  onResize,
}: CollapsiblePanelProps) {
  const config = defaultPanelConfigs[panelKey];
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // 开始调整大小
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = config.position === 'right' 
        ? startXRef.current - e.clientX 
        : e.clientX - startXRef.current;
      const newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidthRef.current + delta));
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isResizing, width, config, onResize]);

  // 折叠状态 - 显示最小入口
  if (!isOpen) {
    return (
      <div
        className={`shrink-0 flex flex-col items-center py-3 bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${className}`}
        style={{ width: config.collapsedWidth }}
      >
        {/* 展开按钮 */}
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group relative"
          title={config.title}
        >
          <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
            {config.icon}
          </span>
          {/* 悬停提示 */}
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {config.title}
          </span>
        </button>

        {/* 额外图标（仅侧边栏） */}
        {panelKey === 'leftSidebar' && (
          <div className="flex flex-col gap-1 mt-4">
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="全部笔记">
              <span className="material-symbols-outlined text-lg text-slate-500">description</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="今日任务">
              <span className="material-symbols-outlined text-lg text-slate-500">today</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="收藏">
              <span className="material-symbols-outlined text-lg text-slate-500">star</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 展开状态
  return (
    <div
      ref={panelRef}
      className={`shrink-0 flex flex-col bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${className} ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
    >
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-slate-500">{config.icon}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{config.title}</span>
        </div>
        
        {/* 折叠按钮 */}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
      {showResizeHandle && (
        <div
          className={`absolute top-0 ${config.position === 'right' ? 'left-0' : 'right-0'} w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors ${isResizing ? 'bg-primary/50' : ''}`}
          onMouseDown={handleResizeStart}
          title="拖拽调整宽度"
        />
      )}
    </div>
  );
}
