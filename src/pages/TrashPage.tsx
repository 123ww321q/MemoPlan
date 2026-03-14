import { useState } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TrashPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrashPage({ isOpen, onClose }: TrashPageProps) {
  const { deletedNotes, restoreNote, permanentlyDeleteNote, emptyTrash } = useNoteStore();
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const handleSelectNote = (id: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === deletedNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(deletedNotes.map(n => n.id)));
    }
  };

  const handleRestore = (id: string) => {
    restoreNote(id);
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleRestoreSelected = () => {
    selectedNotes.forEach(id => restoreNote(id));
    setSelectedNotes(new Set());
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要永久删除这个笔记吗？此操作不可撤销。')) {
      permanentlyDeleteNote(id);
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteSelected = () => {
    if (confirm(`确定要永久删除选中的 ${selectedNotes.size} 个笔记吗？此操作不可撤销。`)) {
      selectedNotes.forEach(id => permanentlyDeleteNote(id));
      setSelectedNotes(new Set());
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('确定要清空回收站吗？所有已删除的笔记将被永久删除，此操作不可撤销。')) {
      emptyTrash();
      setShowConfirmEmpty(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[800px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500">delete</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">回收站</h2>
              <p className="text-sm text-slate-500">已删除的笔记会在这里保留 30 天</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 工具栏 */}
        {deletedNotes.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNotes.size === deletedNotes.length && deletedNotes.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">全选</span>
              </label>
              {selectedNotes.size > 0 && (
                <span className="text-sm text-slate-500">已选择 {selectedNotes.size} 个</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedNotes.size > 0 && (
                <>
                  <button
                    onClick={handleRestoreSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">restore</span>
                    恢复选中
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete_forever</span>
                    永久删除
                  </button>
                </>
              )}
              <button
                onClick={() => setShowConfirmEmpty(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-base">delete_sweep</span>
                清空回收站
              </button>
            </div>
          </div>
        )}

        {/* 笔记列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {deletedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4">delete_outline</span>
              <p className="text-lg font-medium">回收站是空的</p>
              <p className="text-sm mt-1">删除的笔记会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                    selectedNotes.has(note.id)
                      ? 'bg-primary/5 border-primary'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotes.has(note.id)}
                    onChange={() => handleSelectNote(note.id)}
                    className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      {note.isPinned && (
                        <span className="material-symbols-outlined text-primary text-sm">push_pin</span>
                      )}
                      {note.isFavorite && (
                        <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                      {getPreviewText(note.content)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>创建于 {format(note.createdAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
                      <span>•</span>
                      <span>删除于 {note.deletedAt ? format(note.deletedAt, 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '未知'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRestore(note.id)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="恢复"
                    >
                      <span className="material-symbols-outlined">restore</span>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="永久删除"
                    >
                      <span className="material-symbols-outlined">delete_forever</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 清空确认对话框 */}
      {showConfirmEmpty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <div>
                <h4 className="text-lg font-bold">确认清空回收站？</h4>
                <p className="text-sm text-slate-500">{deletedNotes.length} 个笔记将被永久删除</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">此操作不可撤销，删除的笔记将无法恢复。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmEmpty(false)}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEmptyTrash}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
