import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, themeColors } from './stores/settingsStore';
import { useNoteStore } from './stores/noteStore';
import { useTaskStore } from './stores/taskStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import TaskPanel from './components/TaskPanel';
import SettingsPage from './pages/SettingsPage';
import TrashPage from './pages/TrashPage';
import { ViewType } from './types';

function App() {
  const { i18n } = useTranslation();
  const { settings, loadSettings } = useSettingsStore();
  const { init: initNotes, canUndo, canRedo, undo, redo } = useNoteStore();
  const { init: initTasks } = useTaskStore();
  
  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  // 初始化数据库和加载数据
  useEffect(() => {
    const init = async () => {
      try {
        await initNotes();
        await initTasks();
      } catch (error) {
        console.error('初始化失败:', error);
      }
    };
    init();
  }, [initNotes, initTasks]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  // 主题处理
  useEffect(() => {
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
  }, [settings.appearance.theme]);

  // 应用主题色CSS变量
  useEffect(() => {
    const color = themeColors[settings.appearance.themeColor];
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color.primary);
    root.style.setProperty('--primary-light', color.light);
    root.style.setProperty('--primary-dark', color.dark);
  }, [settings.appearance.themeColor]);

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
            onOpenSettings={() => setShowSettings(true)}
            onOpenTrash={() => setShowTrash(true)}
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
    </div>
  );
}

export default App;
