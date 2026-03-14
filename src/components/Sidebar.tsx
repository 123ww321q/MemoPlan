import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
}

export default function Sidebar({ currentView, onViewChange, onOpenSettings, onOpenTrash }: SidebarProps) {
  const { addNote, notes, setCurrentNote, deletedNotes } = useNoteStore();
  const { tasks } = useTaskStore();

  const handleNewNote = () => {
    const newNote = addNote({
      title: '新建笔记',
      content: '',
      tags: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      category: 'notes',
    });
    setTimeout(() => setCurrentNote(newNote.id), 0);
  };

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    
    // 根据不同视图筛选笔记
    switch (view) {
      case 'today':
        const todayTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          const today = new Date().toDateString();
          return new Date(t.dueDate).toDateString() === today;
        });
        if (todayTasks.length > 0 && notes.length > 0) {
          setCurrentNote(notes[0].id);
        }
        break;
      case 'study':
        const studyNotes = notes.filter(n => n.category === 'study');
        if (studyNotes.length > 0) {
          setCurrentNote(studyNotes[0].id);
        }
        break;
      case 'favorites':
        const favNotes = notes.filter(n => n.isFavorite);
        if (favNotes.length > 0) {
          setCurrentNote(favNotes[0].id);
        }
        break;
      case 'archive':
        const archivedNotes = notes.filter(n => n.isArchived);
        if (archivedNotes.length > 0) {
          setCurrentNote(archivedNotes[0].id);
        }
        break;
      case 'all':
      default:
        if (notes.length > 0) {
          setCurrentNote(notes[0].id);
        }
        break;
    }
  };

  const navItems = [
    { id: 'all' as ViewType, icon: 'description', label: '全部笔记', count: notes.length },
    { id: 'today' as ViewType, icon: 'today', label: '今日任务', count: tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).length },
    { id: 'study' as ViewType, icon: 'menu_book', label: '学习计划', count: notes.filter(n => n.category === 'study').length },
    { id: 'favorites' as ViewType, icon: 'star', label: '收藏', count: notes.filter(n => n.isFavorite).length },
    { id: 'archive' as ViewType, icon: 'archive', label: '已归档', count: notes.filter(n => n.isArchived).length },
  ];

  return (
    <aside className="w-60 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shrink-0">
      {/* 新建笔记按钮 */}
      <div className="p-4">
        <button
          onClick={handleNewNote}
          className="w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--primary-color, #ec5b13)' }}
        >
          <span className="material-symbols-outlined">edit_note</span>
          新建笔记
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleViewChange(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
              currentView === item.id
                ? 'font-semibold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            style={{
              backgroundColor: currentView === item.id ? 'var(--primary-light, #fff7ed)' : undefined,
              color: currentView === item.id ? 'var(--primary-color, #ec5b13)' : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
            {item.count > 0 && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: currentView === item.id ? 'var(--primary-color, #ec5b13)' : '#e2e8f0',
                  color: currentView === item.id ? 'white' : '#64748b'
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 底部功能 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {/* 回收站 */}
        <button
          onClick={onOpenTrash}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-500">delete_outline</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">回收站</span>
          </div>
          {deletedNotes.length > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
              {deletedNotes.length}
            </span>
          )}
        </button>

        {/* 设置 */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-slate-500">settings</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">设置</span>
        </button>
      </div>
    </aside>
  );
}
