import { useState, useEffect, useRef, useCallback } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { Note } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPage({ isOpen, onClose }: SearchPageProps) {
  const { notes, searchResults, isSearching, searchNotes, clearSearch, setCurrentNote } = useNoteStore();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('memoplan_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((newQuery: string) => {
    if (!newQuery.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== newQuery);
      const newHistory = [newQuery, ...filtered].slice(0, 10);
      localStorage.setItem('memoplan_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchNotes(query);
        saveSearchHistory(query);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchNotes, clearSearch, saveSearchHistory]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayNotes = query.trim() ? searchResults : notes.slice(0, 20);

  // 获取笔记预览文本
  const getPreviewText = (content: string, searchQuery: string) => {
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

    if (!searchQuery) return plainText.substring(0, 150) + '...';

    // 找到匹配位置并显示上下文
    const lowerText = plainText.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return plainText.substring(0, 150) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(plainText.length, index + searchQuery.length + 50);
    let preview = plainText.substring(start, end);
    
    if (start > 0) preview = '...' + preview;
    if (end < plainText.length) preview = preview + '...';

    return preview;
  };

  // 高亮匹配文本
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  const handleNoteClick = (note: Note) => {
    setCurrentNote(note.id);
    onClose();
    clearSearch();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-[700px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 搜索头部 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索笔记标题、内容、标签..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-0 rounded-xl pl-10 pr-10 py-3 focus:ring-2 focus:ring-primary outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
              >
                <span className="material-symbols-outlined text-slate-400 text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : query.trim() ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-500">
                  搜索结果 ({searchResults.length})
                </h3>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => { clearSearch(); setQuery(''); }}
                    className="text-xs text-primary hover:underline"
                  >
                    清除搜索
                  </button>
                )}
              </div>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                  <p>未找到匹配的笔记</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {note.isPinned && (
                          <span className="material-symbols-outlined text-primary text-sm">push_pin</span>
                        )}
                        <h4 className="font-medium line-clamp-1">
                          {highlightText(note.title, query)}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                        {highlightText(getPreviewText(note.content, query), query)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{format(note.updatedAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
                        {note.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{note.tags.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* 搜索历史 */}
              {searchHistory.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-500">搜索历史</h3>
                    <button
                      onClick={() => {
                        setSearchHistory([]);
                        localStorage.removeItem('memoplan_search_history');
                      }}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      清除
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((history) => (
                      <button
                        key={history}
                        onClick={() => setQuery(history)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {history}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 最近笔记 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">最近笔记</h3>
                <div className="space-y-2">
                  {displayNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {note.isPinned && (
                          <span className="material-symbols-outlined text-primary text-sm">push_pin</span>
                        )}
                        <h4 className="font-medium line-clamp-1">{note.title}</h4>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {getPreviewText(note.content, '')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ 选择</span>
            <span>↵ 打开</span>
            <span>Esc 关闭</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
