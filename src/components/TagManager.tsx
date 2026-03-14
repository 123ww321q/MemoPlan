import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTag?: (tag: string) => void;
}

const tagColors = [
  { name: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  { name: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  { name: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  { name: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  { name: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  { name: 'gray', bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' },
];

export default function TagManager({ isOpen, onClose, onSelectTag }: TagManagerProps) {
  useTranslation();
  const { notes, updateNote } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  // 从 localStorage 加载标签颜色配置
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('tagColors');
    return saved ? JSON.parse(saved) : {};
  });

  // 统计标签使用情况
  const tags = useMemo(() => {
    const tagMap = new Map<string, number>();
    notes.forEach(note => {
      if (!note.isDeleted && note.tags) {
        note.tags.forEach(tag => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        color: tagColorMap[name] || 'gray',
      }))
      .sort((a, b) => b.count - a.count);
  }, [notes, tagColorMap]);

  // 筛选标签
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  // 保存标签颜色
  const saveTagColor = (tagName: string, color: string) => {
    const newMap = { ...tagColorMap, [tagName]: color };
    setTagColorMap(newMap);
    localStorage.setItem('tagColors', JSON.stringify(newMap));
  };

  // 重命名标签
  const renameTag = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingTag(null);
      return;
    }

    // 更新所有笔记中的标签
    for (const note of notes) {
      if (note.tags?.includes(oldName)) {
        const newTags = note.tags.map(t => t === oldName ? newName : t);
        await updateNote(note.id, { tags: newTags });
      }
    }

    // 迁移颜色配置
    if (tagColorMap[oldName]) {
      const newMap = { ...tagColorMap };
      newMap[newName] = newMap[oldName];
      delete newMap[oldName];
      setTagColorMap(newMap);
      localStorage.setItem('tagColors', JSON.stringify(newMap));
    }

    setEditingTag(null);
    setNewTagName('');
  };

  // 删除标签
  const deleteTag = async (tagName: string) => {
    if (!confirm(`确定要删除标签 "${tagName}" 吗？这将从所有笔记中移除该标签。`)) {
      return;
    }

    // 从所有笔记中移除该标签
    for (const note of notes) {
      if (note.tags?.includes(tagName)) {
        const newTags = note.tags.filter(t => t !== tagName);
        await updateNote(note.id, { tags: newTags });
      }
    }

    // 删除颜色配置
    if (tagColorMap[tagName]) {
      const newMap = { ...tagColorMap };
      delete newMap[tagName];
      setTagColorMap(newMap);
      localStorage.setItem('tagColors', JSON.stringify(newMap));
    }
  };

  // 获取标签颜色样式
  const getTagColorStyle = (colorName: string) => {
    return tagColors.find(c => c.name === colorName) || tagColors[7];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[500px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">label</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">标签管理</h2>
              <p className="text-sm text-slate-500">{tags.length} 个标签</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标签..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* 标签列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTags.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2">label_off</span>
              <p>暂无标签</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTags.map((tag) => {
                const colorStyle = getTagColorStyle(tag.color);
                return (
                  <div
                    key={tag.name}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group"
                  >
                    {/* 颜色选择器 */}
                    <div className="relative">
                      <button
                        className={`w-6 h-6 rounded-full ${colorStyle.bg} ${colorStyle.border} border-2`}
                        title="更改颜色"
                      >
                        <div className="absolute top-8 left-0 hidden group-hover:grid grid-cols-4 gap-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                          {tagColors.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => saveTagColor(tag.name, c.name)}
                              className={`w-5 h-5 rounded-full ${c.bg} ${c.border} border hover:scale-110 transition-transform`}
                            />
                          ))}
                        </div>
                      </button>
                    </div>

                    {/* 标签名称 */}
                    {editingTag === tag.name ? (
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onBlur={() => renameTag(tag.name, newTagName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameTag(tag.name, newTagName);
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-primary rounded text-sm"
                      />
                    ) : (
                      <button
                        onClick={() => onSelectTag?.(tag.name)}
                        className={`flex-1 text-left px-2 py-1 rounded text-sm font-medium ${colorStyle.bg} ${colorStyle.text}`}
                      >
                        {tag.name}
                      </button>
                    )}

                    {/* 笔记数量 */}
                    <span className="text-xs text-slate-500">{tag.count} 个笔记</span>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingTag(tag.name);
                          setNewTagName(tag.name);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title="重命名"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => deleteTag(tag.name)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                        title="删除标签"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>点击标签可筛选笔记</span>
            <span>共 {tags.reduce((sum, t) => sum + t.count, 0)} 次使用</span>
          </div>
        </div>
      </div>
    </div>
  );
}
