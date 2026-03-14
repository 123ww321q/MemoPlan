import { useState } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ConfirmDialog from '../components/ConfirmDialog';

interface TrashPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrashPage({ isOpen, onClose }: TrashPageProps) {
  const { deletedNotes, restoreNote, permanentlyDeleteNote, emptyTrash } = useNoteStore();
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = useState(false);

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

  const handleRestore = async (id: string) => {
    await restoreNote(id);
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleRestoreSelected = async () => {
    for (const id of selectedNotes) {
      await restoreNote(id);
    }
    setSelectedNotes(new Set());
  };

  // 显示删除确认对话框
  const handleDeleteClick = (id: string) => {
    setNoteToDelete(id);
    setShowConfirmDelete(true);
  };

  // 确认删除单个笔记
  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      await permanentlyDeleteNote(noteToDelete);
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteToDelete);
        return newSet;
      });
      setNoteToDelete(null);
      setShowConfirmDelete(false);
    }
  };

  // 显示批量删除确认对话框
  const handleDeleteSelectedClick = () => {
    setShowConfirmDeleteSelected(true);
  };

  // 确认批量删除
  const handleConfirmDeleteSelected = async () => {
    for (const id of selectedNotes) {
      await permanentlyDeleteNote(id);
    }
    setSelectedNotes(new Set());
    setShowConfirmDeleteSelected(false);
  };

  // 确认清空回收站
  const handleConfirmEmpty = async () => {
    await emptyTrash();
    setShowConfirmEmpty(false);
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
                    onClick={handleDeleteSelectedClick}
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
                      onClick={() => handleDeleteClick(note.id)}
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

      {/* 删除单个笔记确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="确认永久删除"
        message="确定要永久删除这个笔记吗？此操作不可撤销，笔记将无法恢复。"
        confirmText="永久删除"
        cancelText="取消"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowConfirmDelete(false); setNoteToDelete(null); }}
      />

      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDeleteSelected}
        title="确认批量删除"
        message={`确定要永久删除选中的 ${selectedNotes.size} 个笔记吗？此操作不可撤销。`}
        confirmText="永久删除"
        cancelText="取消"
        type="danger"
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setShowConfirmDeleteSelected(false)}
      />

      {/* 清空回收站确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmEmpty}
        title="确认清空回收站"
        message={`确定要清空回收站吗？${deletedNotes.length} 个笔记将被永久删除，此操作不可撤销。`}
        confirmText="清空回收站"
        cancelText="取消"
        type="danger"
        onConfirm={handleConfirmEmpty}
        onCancel={() => setShowConfirmEmpty(false)}
      />
    </div>
  );
}
