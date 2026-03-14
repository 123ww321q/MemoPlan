import { useTranslation } from 'react-i18next';
import { appWindow } from '@tauri-apps/api/window';
import { useNoteStore } from '../stores/noteStore';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  onOpenSearch: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function Header({ onOpenSettings, onOpenTrash, onOpenSearch, canUndo, canRedo, onUndo, onRedo }: HeaderProps) {
  const { t } = useTranslation();
  const { addNote, setCurrentNote } = useNoteStore();

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.hide();

  // 新建笔记
  const handleNewNote = async () => {
    const newNote = await addNote({
      title: '新建笔记',
      content: '',
      tags: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      category: 'notes',
    });
    setCurrentNote(newNote.id);
  };

  return (
    <header 
      className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 z-50 relative"
      style={{ backgroundColor: 'var(--primary-light, #fff7ed)' }}
      data-tauri-drag-region
    >
      {/* 左侧 - Logo和撤销/重做 */}
      <div className="flex items-center gap-4 w-auto">
        <div 
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: 'var(--primary-color, #ec5b13)' }}
        >
          <span className="material-symbols-outlined text-white text-xl">grid_view</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight">{t('app.name')}</h2>
        
        {/* 撤销/重做按钮 */}
        <div className="flex items-center gap-1 ml-4 pl-4 border-l border-slate-300 dark:border-slate-600">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700"
            title="撤销 (Ctrl+Z)"
          >
            <span className="material-symbols-outlined text-lg">undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700"
            title="重做 (Ctrl+Shift+Z)"
          >
            <span className="material-symbols-outlined text-lg">redo</span>
          </button>
        </div>
      </div>

      {/* 中间 - 搜索按钮 */}
      <div className="flex-1 max-w-xl mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-primary transition-all"
        >
          <span className="material-symbols-outlined text-slate-400">search</span>
          <span>搜索笔记...</span>
          <span className="ml-auto text-xs text-slate-400">Ctrl+Shift+F</span>
        </button>
      </div>

      {/* 右侧 - 功能按钮 */}
      <div className="flex items-center gap-2">
        <button 
          onClick={handleNewNote}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          style={{ color: 'var(--primary-color, #ec5b13)' }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          新建
        </button>

        <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1"></div>
        
        <button 
          onClick={onOpenSearch}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="搜索 (Ctrl+Shift+F)"
        >
          <span className="material-symbols-outlined text-xl">search</span>
        </button>
        
        <button 
          onClick={onOpenTrash}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="回收站"
        >
          <span className="material-symbols-outlined text-xl">delete_outline</span>
        </button>
        
        <button 
          onClick={onOpenSettings}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="设置 (Ctrl+,)"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>

        <div className="flex items-center ml-2">
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg" onClick={handleMinimize}>
            <span className="material-symbols-outlined text-sm">remove</span>
          </button>
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg" onClick={handleMaximize}>
            <span className="material-symbols-outlined text-sm">check_box_outline_blank</span>
          </button>
          <button className="p-2 hover:bg-red-500 hover:text-white transition-colors rounded-lg" onClick={handleClose}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
    </header>
  );
}
