import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { linkService, Backlink } from '../services/linkService';

interface BacklinkPanelProps {
  noteId: string;
  noteTitle: string;
  onSelectNote: (noteId: string) => void;
}

export default function BacklinkPanel({ noteId, noteTitle, onSelectNote }: BacklinkPanelProps) {
  const { t } = useTranslation();
  const { notes } = useNoteStore();
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [unlinkedMentions, setUnlinkedMentions] = useState<Backlink[]>([]);
  const [activeTab, setActiveTab] = useState<'backlinks' | 'mentions'>('backlinks');

  useEffect(() => {
    if (noteId && noteTitle) {
      const links = linkService.getBacklinks(noteId, noteTitle, notes);
      setBacklinks(links);

      const mentions = linkService.getUnlinkedMentions(noteId, noteTitle, notes);
      setUnlinkedMentions(mentions);
    }
  }, [noteId, noteTitle, notes]);

  if (backlinks.length === 0 && unlinkedMentions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
      {/* 标签页切换 */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('backlinks')}
          className={`text-sm font-medium transition-colors ${
            activeTab === 'backlinks'
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {t('editor.backlinks')} ({backlinks.length})
        </button>
        {unlinkedMentions.length > 0 && (
          <button
            onClick={() => setActiveTab('mentions')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'mentions'
                ? 'text-primary'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('editor.unlinkedMentions')} ({unlinkedMentions.length})
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="max-h-48 overflow-y-auto">
        {activeTab === 'backlinks' && (
          <div className="p-2 space-y-1">
            {backlinks.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                {t('editor.noBacklinks')}
              </p>
            ) : (
              backlinks.map((backlink, index) => (
                <button
                  key={`${backlink.noteId}-${index}`}
                  onClick={() => onSelectNote(backlink.noteId)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary">
                      {backlink.noteTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 pl-6">
                    {backlink.context}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'mentions' && (
          <div className="p-2 space-y-1">
            {unlinkedMentions.map((mention, index) => (
              <button
                key={`${mention.noteId}-${index}`}
                onClick={() => onSelectNote(mention.noteId)}
                className="w-full text-left p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary">
                    {mention.noteTitle}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                    {t('editor.unlinked')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 pl-6">
                  {mention.context}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
