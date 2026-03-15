import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function Editor() {
  const { t } = useTranslation();
  const { getCurrentNote, updateNote } = useNoteStore();
  const { convertMarkdownToTasks } = useTaskStore();
  const { settings } = useSettingsStore();
  const currentNote = getCurrentNote();

  const [content, setContent] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState('');
  const [title, setTitle] = useState('');

  // 加载当前笔记内容
  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content);
      setTitle(currentNote.title);
    }
  }, [currentNote?.id]);

  // 监听笔记标题变化
  useEffect(() => {
    if (currentNote && title !== currentNote.title) {
      setTitle(currentNote.title);
    }
  }, [currentNote?.title]);

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

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      {/* 标题栏 */}
      <div className="px-3 pt-2 pb-2 border-b border-[var(--panel-border)] shrink-0">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full text-base font-bold bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          placeholder={t('sidebar.newNoteTitle')}
        />
      </div>

      {/* 工具栏 */}
      {currentNote && (
        <div className="h-9 border-b border-[var(--panel-border)] flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-1">
            <button 
              onClick={handleTogglePin}
              className={`p-1.5 rounded-md transition-colors ${
                currentNote.isPinned 
                  ? 'text-primary bg-primary/10' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)]'
              }`}
              title={t('editor.pin')}
            >
              <span className="material-symbols-outlined text-lg">
                push_pin
              </span>
            </button>
            <button 
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-md transition-colors ${
                currentNote.isFavorite 
                  ? 'text-yellow-500 bg-yellow-500/10' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)]'
              }`}
              title={t('editor.favorite')}
            >
              <span className="material-symbols-outlined text-lg">
                star
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 一键生成待办按钮 */}
            <button
              onClick={handleConvertToTasks}
              disabled={isConverting || !content.trim()}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {isConverting ? 'sync' : 'checklist'}
              </span>
              {isConverting ? t('editor.converting') : t('editor.convertToTask')}
            </button>
          </div>
        </div>
      )}

      {/* 转换结果提示 */}
      {currentNote && convertMessage && (
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--panel-border)] shrink-0">
          <p className="text-xs text-[var(--text-secondary)]">{convertMessage}</p>
        </div>
      )}

      {/* 编辑器主体 - 完整的撰写区域 */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full p-3 bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          placeholder={t('editor.startWriting')}
          spellCheck={false}
          style={{
            fontSize: `${settings.editor.fontSize}px`,
            fontFamily: settings.editor.fontFamily,
          }}
        />
      </div>
    </div>
  );
}
