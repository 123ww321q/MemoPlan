import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, themeColors } from './stores/settingsStore';
import { useNoteStore } from './stores/noteStore';
import { useTaskStore } from './stores/taskStore';
import { listen } from '@tauri-apps/api/event';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import TaskPanel from './components/TaskPanel';
import SettingsPage from './pages/SettingsPage';
import TrashPage from './pages/TrashPage';
import SearchPage from './pages/SearchPage';
import NoteGraph from './components/NoteGraph';
import SyncSettings from './components/SyncSettings';
import TagManager from './components/TagManager';
import ImportDialog from './components/ImportDialog';
import ToastContainer, { ToastMessage, setToastHandlers } from './components/Toast';
import { ViewType } from './types';

function App() {
  const { i18n, t } = useTranslation();
  const { settings, loadSettings } = useSettingsStore();
  const { init: initNotes, canUndo, canRedo, undo, redo, addNote, setCurrentNote } = useNoteStore();
  const { init: initTasks } = useTaskStore();

  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 初始化数据库和加载数据
  useEffect(() => {
    const init = async () => {
      try {
        await initNotes();
        await initTasks();
        await loadSettings();
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化失败:', error);
      }
    };
    init();
  }, [initNotes, initTasks, loadSettings]);

  // 监听 Tauri 全局快捷键事件
  useEffect(() => {
    if (!isInitialized) return;

    const unlistenNewNote = listen('new-note', () => {
      addNote({
        title: '新建笔记',
        content: '',
        tags: [],
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        category: 'notes',
      });
    });

    const unlistenFocusSearch = listen('focus-search', () => {
      setShowSearch(true);
    });

    return () => {
      unlistenNewNote.then(fn => fn());
      unlistenFocusSearch.then(fn => fn());
    };
  }, [isInitialized, addNote]);

  useEffect(() => {
    if (isInitialized) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n, isInitialized]);

  // 主题处理
  useEffect(() => {
    if (!isInitialized) return;

    const applyTheme = () => {
      let theme = settings.appearance.theme;
      
      if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (settings.appearance.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [settings.appearance.theme, isInitialized]);

  // 应用主题色CSS变量
  useEffect(() => {
    if (!isInitialized) return;
    
    const color = themeColors[settings.appearance.themeColor];
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color.primary);
    root.style.setProperty('--primary-light', color.light);
    root.style.setProperty('--primary-dark', color.dark);
  }, [settings.appearance.themeColor, isInitialized]);

  // Toast 处理函数
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 设置 Toast 处理程序
  useEffect(() => {
    setToastHandlers({ add: addToast, remove: removeToast });
  }, [addToast, removeToast]);

  // 处理从图谱选择笔记
  const handleSelectNoteFromGraph = useCallback((noteId: string) => {
    setCurrentNote(noteId);
    setShowGraph(false);
    addToast({ type: 'success', message: t('toast.noteOpened'), duration: 2000 });
  }, [setCurrentNote, addToast, t]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Ctrl/Cmd + , 打开设置
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
      // Ctrl/Cmd + Shift + F 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Ctrl/Cmd + Shift + G 打开图谱
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        setShowGraph(true);
      }
      // Ctrl/Cmd + Shift + T 打开标签管理器
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 't') {
        e.preventDefault();
        setShowTagManager(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // 获取背景样式
  const getBackgroundStyle = () => {
    const { backgroundImage, backgroundMode, backgroundBlur, backgroundOpacity } = settings.appearance;
    
    if (backgroundImage) {
      const mode = backgroundMode === 'fill' ? 'cover' : 
                   backgroundMode === 'fit' ? 'contain' : 
                   backgroundMode === 'center' ? 'auto' : 'auto';
      const repeat = backgroundMode === 'tile' ? 'repeat' : 'no-repeat';
      const position = 'center';
      
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: mode,
        backgroundRepeat: repeat,
        backgroundPosition: position,
        filter: `blur(${backgroundBlur}px)`,
        opacity: backgroundOpacity / 100,
      };
    }
    
    return undefined;
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-slate-100 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">正在初始化...</p>
        </div>
      </div>
    );
  }

  const backgroundStyle = getBackgroundStyle();
  const isDark = settings.appearance.theme === 'dark' || 
    (settings.appearance.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div 
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{
        fontFamily: settings.editor.fontFamily,
      }}
    >
      {/* 背景层 */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          ...backgroundStyle,
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        }}
      />
      
      {/* 遮罩层 - 用于提高文字可读性 */}
      <div 
        className="fixed inset-0 -z-5"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(248, 250, 252, 0.85)',
          backdropFilter: `blur(${settings.appearance.backgroundBlur}px)`,
        }}
      />

      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenTrash={() => setShowTrash(true)}
        onOpenSearch={() => setShowSearch(true)}
        onOpenGraph={() => setShowGraph(true)}
        onOpenSync={() => setShowSync(true)}
        onOpenTags={() => setShowTagManager(true)}
        onOpenImport={() => setShowImport(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {settings.appearance.sidebarVisible && (
          <Sidebar 
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        )}
        
        {settings.appearance.noteListVisible && (
          <NoteList currentView={currentView} />
        )}
        
        <Editor />
        
        {settings.appearance.taskPanelVisible && (
          <TaskPanel />
        )}
      </div>

      {/* 设置页面 */}
      <SettingsPage 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* 回收站页面 */}
      <TrashPage 
        isOpen={showTrash} 
        onClose={() => setShowTrash(false)} 
      />

      {/* 搜索页面 */}
      <SearchPage
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      {/* 笔记图谱 */}
      <NoteGraph
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        onSelectNote={handleSelectNoteFromGraph}
      />

      {/* 同步设置 */}
      <SyncSettings
        isOpen={showSync}
        onClose={() => setShowSync(false)}
      />

      {/* 标签管理器 */}
      <TagManager
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        onSelectTag={(tag) => {
          setShowTagManager(false);
          addToast({ type: 'info', message: `已选择标签: ${tag}`, duration: 2000 });
        }}
      />

      {/* 导入对话框 */}
      <ImportDialog
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
