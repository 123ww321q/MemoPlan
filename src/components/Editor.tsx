import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { marked } from 'marked';

// 配置 marked 支持表格和任务列表
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 自定义 renderer 支持任务列表
const renderer = new marked.Renderer();
const originalListItem = renderer.listitem;
renderer.listitem = (text: string, task: boolean, checked: boolean) => {
  if (task) {
    return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${text}</li>`;
  }
  return originalListItem.call(renderer, text, task, checked);
};
marked.use({ renderer });

export default function Editor() {
  const { t } = useTranslation();
  const { getCurrentNote, updateNote } = useNoteStore();
  const { convertMarkdownToTasks } = useTaskStore();
  useSettingsStore();
  const currentNote = getCurrentNote();

  const [content, setContent] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState('');
  const [editorWidth, setEditorWidth] = useState(50); // 编辑器宽度百分比
  const [isResizing, setIsResizing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [title, setTitle] = useState('');
  
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载当前笔记内容
  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content);
      setTitle(currentNote.title);
    }
  }, [currentNote?.id]);

  // 处理拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // 限制最小和最大宽度
    if (newWidth >= 20 && newWidth <= 80) {
      setEditorWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (currentNote) {
      updateNote(currentNote.id, { content: newContent, updatedAt: Date.now() });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentNote) {
      updateNote(currentNote.id, { title: newTitle, updatedAt: Date.now() });
    }
  };

  // 切换收藏
  const handleToggleFavorite = () => {
    if (currentNote) {
      updateNote(currentNote.id, { 
        isFavorite: !currentNote.isFavorite,
        updatedAt: Date.now()
      });
    }
  };

  // 切换置顶
  const handleTogglePin = () => {
    if (currentNote) {
      updateNote(currentNote.id, { 
        isPinned: !currentNote.isPinned,
        updatedAt: Date.now()
      });
    }
  };

  // 切换预览显示
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
    if (showPreview) {
      setEditorWidth(100);
    } else {
      setEditorWidth(50);
    }
  };

  // 一键生成待办
  const handleConvertToTasks = async () => {
    if (!currentNote || !content.trim()) return;

    setIsConverting(true);
    setConvertMessage('');

    try {
      const taskCount = await convertMarkdownToTasks(content, currentNote.id);

      if (taskCount > 0) {
        setConvertMessage(`✅ ${t('editor.convertSuccess', { count: taskCount })}`);
      } else {
        setConvertMessage('⚠️ ' + t('editor.noTasksFound'));
      }

      setTimeout(() => setConvertMessage(''), 3000);
    } catch (error) {
      console.error('转换任务失败:', error);
      setConvertMessage('❌ ' + t('editor.convertError'));
    } finally {
      setIsConverting(false);
    }
  };

  // 渲染 Markdown 内容
  const renderMarkdown = (text: string) => {
    try {
      return marked(text);
    } catch (error) {
      console.error('Markdown 渲染错误:', error);
      return text;
    }
  };

  if (!currentNote) {
    return (
      <section className="flex-1 flex items-center justify-center bg-white/50 dark:bg-slate-900/30">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4">description</span>
          <p>{t('editor.selectOrCreate')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-white/80 dark:bg-slate-900/80 overflow-hidden" ref={containerRef}>
      {/* 标题栏 */}
      <div className="px-6 pt-4 pb-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
          placeholder={t('sidebar.newNoteTitle')}
        />
      </div>

      {/* 工具栏 */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <button 
            onClick={handleTogglePin}
            className={`p-1.5 rounded-md transition-colors ${
              currentNote.isPinned 
                ? 'text-primary bg-primary/10' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t('editor.pin')}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentNote.isPinned ? "'FILL' 1" : "" }}>
              push_pin
            </span>
          </button>
          <button 
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-md transition-colors ${
              currentNote.isFavorite 
                ? 'text-yellow-500 bg-yellow-500/10' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t('editor.favorite')}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentNote.isFavorite ? "'FILL' 1" : "" }}>
              star
            </span>
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
          <button 
            onClick={handleTogglePreview}
            className={`p-1.5 rounded-md transition-colors ${
              showPreview 
                ? 'text-primary bg-primary/10' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={showPreview ? t('editor.hidePreview') : t('editor.showPreview')}
          >
            <span className="material-symbols-outlined text-lg">
              {showPreview ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 一键生成待办按钮 */}
          <button
            onClick={handleConvertToTasks}
            disabled={isConverting || !content.trim()}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              {isConverting ? 'sync' : 'checklist'}
            </span>
            {isConverting ? t('editor.converting') : t('editor.convertToTask')}
          </button>
        </div>
      </div>

      {/* 转换结果提示 */}
      {convertMessage && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">{convertMessage}</p>
        </div>
      )}

      {/* 编辑器主体 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 编辑区域 */}
        <div 
          className="flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/30"
          style={{ width: `${showPreview ? editorWidth : 100}%` }}
        >
          <textarea
            value={content}
            onChange={handleContentChange}
            className="flex-1 w-full p-6 bg-transparent border-none outline-none resize-none text-sm leading-relaxed markdown-editor"
            placeholder={t('editor.startWriting')}
            spellCheck={false}
          />
        </div>

        {/* 拖拽调整条 */}
        {showPreview && (
          <div
            ref={resizeRef}
            onMouseDown={handleMouseDown}
            className="w-1 cursor-col-resize bg-slate-200 dark:bg-slate-700 hover:bg-primary/50 transition-colors relative group"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-slate-300 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-0.5 h-3 bg-slate-500 rounded-full mx-0.5" />
              <div className="w-0.5 h-3 bg-slate-500 rounded-full mx-0.5" />
            </div>
          </div>
        )}

        {/* 预览区域 */}
        {showPreview && (
          <div
            className="flex-1 p-6 overflow-y-auto prose dark:prose-invert max-w-none bg-white dark:bg-slate-900/50"
            style={{ width: `${100 - editorWidth}%` }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </section>
  );
}
