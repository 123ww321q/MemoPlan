import { useState, useRef, useEffect, useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { useSettingsStore } from '../stores/settingsStore';
import { ViewType } from '../types';
import { format } from 'date-fns';
import ConfirmDialog from './ConfirmDialog';

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  noteId: string | null;
}

interface NoteListProps {
  currentView?: ViewType;
}

// 笔记背景颜色选项
const noteColors = [
  { name: 'default', bg: 'bg-white dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', preview: 'bg-slate-200' },
  { name: 'red', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', preview: 'bg-red-400' },
  { name: 'orange', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', preview: 'bg-orange-400' },
  { name: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', preview: 'bg-yellow-400' },
  { name: 'green', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', preview: 'bg-green-400' },
  { name: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', preview: 'bg-blue-400' },
  { name: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', preview: 'bg-purple-400' },
  { name: 'pink', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', preview: 'bg-pink-400' },
];

export default function NoteList({ currentView = 'all' }: NoteListProps) {
  const { notes, currentNoteId, setCurrentNote, updateNote, deleteNote } = useNoteStore();
  const { settings } = useSettingsStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    noteId: null,
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 根据当前视图筛选笔记
  const filteredNotes = useMemo(() => {
    let result = notes;
    
    // 根据视图筛选
    switch (currentView) {
      case 'today':
        result = result.filter(n => {
          const today = new Date().toDateString();
          return new Date(n.updatedAt).toDateString() === today;
        });
        break;
      case 'study':
        result = result.filter(n => n.category === 'study');
        break;
      case 'favorites':
        result = result.filter(n => n.isFavorite);
        break;
      case 'archive':
        result = result.filter(n => n.isArchived);
        break;
      case 'all':
      default:
        break;
    }
    
    // 根据搜索词筛选
    if (searchQuery.trim()) {
      result = result.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return result;
  }, [notes, currentView, searchQuery]);

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ show: false, x: 0, y: 0, noteId: null });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      noteId,
    });
  };

  // 重命名笔记
  const handleRename = () => {
    if (contextMenu.noteId) {
      const note = notes.find(n => n.id === contextMenu.noteId);
      if (note) {
        setEditingNoteId(contextMenu.noteId);
        setEditTitle(note.title);
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 保存重命名
  const handleSaveRename = async () => {
    if (editingNoteId && editTitle.trim()) {
      await updateNote(editingNoteId, { title: editTitle.trim() });
    }
    setEditingNoteId(null);
    setEditTitle('');
  };

  // 取消重命名
  const handleCancelRename = () => {
    setEditingNoteId(null);
    setEditTitle('');
  };

  // 删除笔记 - 先显示确认对话框
  const handleDeleteClick = () => {
    if (contextMenu.noteId) {
      if (settings.general.confirmDelete) {
        // 显示确认对话框
        setNoteToDelete(contextMenu.noteId);
        setShowDeleteConfirm(true);
      } else {
        // 直接删除
        deleteNote(contextMenu.noteId);
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete);
      setNoteToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setNoteToDelete(null);
    setShowDeleteConfirm(false);
  };

  // 置顶/取消置顶
  const handleTogglePin = async () => {
    if (contextMenu.noteId) {
      const note = notes.find(n => n.id === contextMenu.noteId);
      if (note) {
        await updateNote(contextMenu.noteId, { isPinned: !note.isPinned });
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (contextMenu.noteId) {
      const note = notes.find(n => n.id === contextMenu.noteId);
      if (note) {
        await updateNote(contextMenu.noteId, { isFavorite: !note.isFavorite });
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 归档/取消归档
  const handleToggleArchive = async () => {
    if (contextMenu.noteId) {
      const note = notes.find(n => n.id === contextMenu.noteId);
      if (note) {
        await updateNote(contextMenu.noteId, { isArchived: !note.isArchived });
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 导出笔记
  const handleExport = () => {
    if (contextMenu.noteId) {
      const note = notes.find(n => n.id === contextMenu.noteId);
      if (note) {
        const format = settings.export.defaultFormat;
        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
          case 'md':
            content = settings.export.includeMetadata 
              ? `---\ntitle: ${note.title}\ncreated: ${new Date(note.createdAt).toISOString()}\nupdated: ${new Date(note.updatedAt).toISOString()}\ntags: [${note.tags.join(', ')}]\n---\n\n${note.content}`
              : note.content;
            filename = `${note.title}.md`;
            mimeType = 'text/markdown';
            break;
          case 'txt':
            content = settings.export.includeMetadata
              ? `标题: ${note.title}\n创建时间: ${new Date(note.createdAt).toLocaleString()}\n更新时间: ${new Date(note.updatedAt).toLocaleString()}\n标签: ${note.tags.join(', ')}\n\n${note.content}`
              : note.content;
            filename = `${note.title}.txt`;
            mimeType = 'text/plain';
            break;
          case 'html':
            content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${note.title}</title>
</head>
<body>
  ${settings.export.includeMetadata ? `
  <header>
    <h1>${note.title}</h1>
    <p>创建时间: ${new Date(note.createdAt).toLocaleString()}</p>
    <p>更新时间: ${new Date(note.updatedAt).toLocaleString()}</p>
    ${note.tags.length > 0 ? `<p>标签: ${note.tags.join(', ')}</p>` : ''}
  </header>
  <hr>
  ` : `<h1>${note.title}</h1>`}
  <pre>${note.content}</pre>
</body>
</html>`;
            filename = `${note.title}.html`;
            mimeType = 'text/html';
            break;
          case 'json':
            content = JSON.stringify(note, null, 2);
            filename = `${note.title}.json`;
            mimeType = 'application/json';
            break;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 更改笔记颜色
  const handleChangeColor = async (colorName: string) => {
    if (contextMenu.noteId) {
      await updateNote(contextMenu.noteId, { color: colorName });
    }
    setContextMenu({ show: false, x: 0, y: 0, noteId: null });
  };

  // 获取笔记颜色样式
  const getNoteColorStyle = (colorName?: string) => {
    const color = noteColors.find(c => c.name === colorName) || noteColors[0];
    return `${color.bg} ${color.border}`;
  };

  // 获取笔记预览文本
  const getPreviewText = (content: string) => {
    const plainText = content
      .replace(/#+ /g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/- \[([ x])\] /g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plainText.substring(0, 100) || '无内容...';
  };

  return (
    <main className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 shrink-0 relative">
      {/* 搜索栏 */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary-color,#ec5b13)] outline-none transition-all"
            placeholder="搜索笔记..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 视图标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">
            {currentView === 'all' && '全部笔记'}
            {currentView === 'today' && '今日任务'}
            {currentView === 'study' && '学习计划'}
            {currentView === 'favorites' && '收藏'}
            {currentView === 'archive' && '已归档'}
          </h3>
          <span className="text-xs text-slate-400">{filteredNotes.length} 个</span>
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <span className="material-symbols-outlined text-4xl mb-2">note_add</span>
            <p className="text-xs">暂无笔记</p>
            <p className="text-[10px] mt-1">点击左侧"新建笔记"开始创作</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setCurrentNote(note.id)}
              onContextMenu={(e) => handleContextMenu(e, note.id)}
              className={`p-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                currentNoteId === note.id 
                  ? 'ring-2' 
                  : getNoteColorStyle(note.color)
              }`}
              style={{
                borderColor: currentNoteId === note.id ? 'var(--primary-color, #ec5b13)' : undefined,
              }}
            >
              <div className="flex justify-between items-start mb-1">
                {editingNoteId === note.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename();
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    autoFocus
                    className="text-sm font-bold leading-tight bg-transparent border-b outline-none w-full"
                    style={{ borderColor: 'var(--primary-color, #ec5b13)' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 className="text-sm font-bold leading-tight truncate pr-2">{note.title}</h3>
                )}
                <div className="flex gap-1 shrink-0">
                  {note.isPinned && (
                    <span 
                      className="material-symbols-outlined text-sm"
                      style={{ color: 'var(--primary-color, #ec5b13)' }}
                    >
                      push_pin
                    </span>
                  )}
                  {note.isFavorite && (
                    <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                {getPreviewText(note.content)}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1 flex-wrap">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded"
                      style={{ 
                        backgroundColor: 'var(--primary-light, #fff7ed)',
                        color: 'var(--primary-color, #ec5b13)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded">
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 shrink-0">
                  {format(note.updatedAt, 'MM-dd')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 min-w-[160px]"
        >
          <button
            onClick={handleRename}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            重命名
          </button>
          <button
            onClick={handleTogglePin}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">push_pin</span>
            {notes.find(n => n.id === contextMenu.noteId)?.isPinned ? '取消置顶' : '置顶'}
          </button>
          <button
            onClick={handleToggleFavorite}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">star</span>
            {notes.find(n => n.id === contextMenu.noteId)?.isFavorite ? '取消收藏' : '收藏'}
          </button>
          <button
            onClick={handleToggleArchive}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">archive</span>
            {notes.find(n => n.id === contextMenu.noteId)?.isArchived ? '取消归档' : '归档'}
          </button>
          
          {/* 导出选项 */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-1 pt-1">
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">download</span>
              导出 ({settings.export.defaultFormat.toUpperCase()})
            </button>
          </div>
          
          {/* 颜色选择 */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-1 pt-1 px-2">
            <div className="text-xs text-slate-500 mb-1 px-2">更改颜色</div>
            <div className="flex gap-1 px-2">
              {noteColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleChangeColor(color.name)}
                  className={`w-5 h-5 rounded-full border-2 border-slate-300 hover:scale-110 transition-transform ${color.preview}`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
          <button
            onClick={handleDeleteClick}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            删除
          </button>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这个笔记吗？删除后可以在回收站中恢复。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
