import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { MarkdownParser } from '../services/markdownParser';
import { useEffect, useState } from 'react';

export default function StatusBar() {
  const { t, i18n } = useTranslation();
  const { getCurrentNote, notes } = useNoteStore();
  const { tasks, getTasksByNoteId } = useTaskStore();
  const { settings } = useSettingsStore();
  const currentNote = getCurrentNote();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // 计算统计数据
  const wordCount = currentNote ? MarkdownParser.countWords(currentNote.content) : 0;
  const charCount = currentNote ? currentNote.content.length : 0;
  const lineCount = currentNote ? currentNote.content.split('\n').length : 0;
  
  // 获取当前笔记的任务统计
  const currentNoteTasks = currentNote ? getTasksByNoteId(currentNote.id) : [];
  const completedTasks = currentNoteTasks.filter(t => t.completed).length;
  const totalTasks = currentNoteTasks.length;
  
  // 全局统计
  const totalNotes = notes.length;
  const totalAllTasks = tasks.length;
  const totalCompletedTasks = tasks.filter(t => t.completed).length;
  
  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 监听保存状态
  useEffect(() => {
    if (currentNote) {
      setSaveStatus('saved');
      const timer = setTimeout(() => {
        setSaveStatus('saved');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentNote?.content, currentNote?.title]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(i18n.language, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="h-6 bg-primary dark:bg-primary/80 flex items-center px-3 justify-between text-[10px] text-white font-medium shrink-0 select-none">
      {/* 左侧状态信息 */}
      <div className="flex items-center gap-4">
        {/* 保存状态 */}
        <span className="flex items-center gap-1" title={t('status.saveStatus')}>
          <span className="material-symbols-outlined text-[12px]">
            {saveStatus === 'saved' ? 'check_circle' : saveStatus === 'saving' ? 'sync' : 'warning'}
          </span>
          <span className={saveStatus === 'saving' ? 'animate-pulse' : ''}>
            {t(`status.${saveStatus}`)}
          </span>
        </span>
        
        {/* 分隔符 */}
        <span className="opacity-30">|</span>
        
        {/* 字数统计 */}
        {currentNote && (
          <>
            <span className="opacity-90" title={t('status.words')}>
              {t('status.words')}: {wordCount}
            </span>
            <span className="opacity-75" title={t('status.characters')}>
              {charCount} {t('status.chars')}
            </span>
            <span className="opacity-75" title={t('status.lines')}>
              {lineCount} {t('status.lines')}
            </span>
          </>
        )}
        
        {/* 分隔符 */}
        {currentNote && <span className="opacity-30">|</span>}
        
        {/* 任务统计 */}
        {currentNote && totalTasks > 0 && (
          <span className="flex items-center gap-1 opacity-90" title={t('status.taskProgress')}>
            <span className="material-symbols-outlined text-[12px]">task_alt</span>
            {completedTasks}/{totalTasks}
          </span>
        )}
      </div>
      
      {/* 中间信息 */}
      <div className="flex items-center gap-4">
        {/* 全局统计 */}
        <span className="opacity-75 flex items-center gap-1" title={t('status.totalNotes')}>
          <span className="material-symbols-outlined text-[12px]">description</span>
          {totalNotes}
        </span>
        <span className="opacity-75 flex items-center gap-1" title={t('status.totalTasks')}>
          <span className="material-symbols-outlined text-[12px]">checklist</span>
          {totalCompletedTasks}/{totalAllTasks}
        </span>
      </div>
      
      {/* 右侧信息 */}
      <div className="flex items-center gap-4">
        {/* 编码格式 */}
        <span className="uppercase tracking-tighter opacity-90" title={t('status.encoding')}>
          UTF-8
        </span>
        
        {/* 文档类型 */}
        <span className="uppercase tracking-tighter opacity-90" title={t('status.format')}>
          Markdown
        </span>
        
        {/* 分隔符 */}
        <span className="opacity-30">|</span>
        
        {/* 日期时间 */}
        <span className="opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
          {formatDate(currentTime)}
        </span>
        <span className="opacity-90 font-mono">
          {formatTime(currentTime)}
        </span>
        
        {/* 语言指示器 */}
        <span className="opacity-75 uppercase tracking-tighter">
          {settings.language}
        </span>
      </div>
    </div>
  );
}
