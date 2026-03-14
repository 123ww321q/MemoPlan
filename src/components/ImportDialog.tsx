import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useToast } from './Toast';
import { Note } from '../types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportPreview {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
  conflict?: boolean;
  selected: boolean;
}

export default function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  useTranslation();
  const { notes, addNote } = useNoteStore();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<'json' | 'markdown' | 'folder'>('json');
  const [previewItems, setPreviewItems] = useState<ImportPreview[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  // 解析 Markdown 文件内容
  const parseMarkdownFile = (content: string, filename: string): ImportPreview => {
    // 尝试解析 YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    let title = filename.replace(/\.md$/i, '');
    let tags: string[] = [];
    let body = content;

    if (frontmatterMatch) {
      const yamlContent = frontmatterMatch[1];
      body = frontmatterMatch[2].trim();
      
      // 解析 YAML
      const titleMatch = yamlContent.match(/^title:\s*(.+)$/m);
      if (titleMatch) title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
      
      const tagsMatch = yamlContent.match(/^tags:\s*(.+)$/m);
      if (tagsMatch) {
        tags = tagsMatch[1].split(/[,;]/).map(t => t.trim()).filter(Boolean);
      }
      

    }

    // 如果没有 frontmatter，尝试从第一行获取标题
    if (!frontmatterMatch) {
      const lines = content.split('\n');
      const firstLine = lines[0].trim();
      if (firstLine.startsWith('# ')) {
        title = firstLine.substring(2).trim();
        body = lines.slice(1).join('\n').trim();
      }
    }

    return {
      id: crypto.randomUUID(),
      title,
      content: body,
      tags,
      source: filename,
      selected: true,
    };
  };

  // 检查冲突
  const checkConflicts = (items: ImportPreview[]): ImportPreview[] => {
    const existingTitles = new Set(notes.map(n => n.title.toLowerCase()));
    return items.map(item => ({
      ...item,
      conflict: existingTitles.has(item.title.toLowerCase()),
    }));
  };

  // 处理 JSON 文件导入
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let items: ImportPreview[] = [];

        if (json.notes && Array.isArray(json.notes)) {
          // MemoPlan 格式
          items = json.notes.map((note: Partial<Note>) => ({
            id: crypto.randomUUID(),
            title: note.title || '未命名笔记',
            content: note.content || '',
            tags: note.tags || [],
            source: file.name,
            selected: true,
          }));
        } else if (Array.isArray(json)) {
          // 纯数组格式
          items = json.map((item: any) => ({
            id: crypto.randomUUID(),
            title: item.title || item.name || '未命名笔记',
            content: item.content || item.body || item.text || '',
            tags: item.tags || [],
            source: file.name,
            selected: true,
          }));
        }

        setPreviewItems(checkConflicts(items));
        toast.success(`已加载 ${items.length} 个笔记`);
      } catch (error) {
        toast.error('JSON 解析失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 处理 Markdown 文件导入
  const handleMarkdownImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const items: ImportPreview[] = [];
    let processedCount = 0;

    files.forEach(file => {
      if (!file.name.endsWith('.md')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        items.push(parseMarkdownFile(content, file.name));
        processedCount++;
        
        if (processedCount === files.length) {
          setPreviewItems(checkConflicts(items));
          toast.success(`已加载 ${items.length} 个 Markdown 文件`);
        }
      };
      reader.readAsText(file);
    });
    
    e.target.value = '';
  };

  // 执行导入
  const executeImport = async () => {
    const selectedItems = previewItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast.warning('请选择要导入的笔记');
      return;
    }

    setIsImporting(true);
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of selectedItems) {
      try {
        if (item.conflict) {
          skipped++;
          continue;
        }
        
        await addNote({
          title: item.title,
          content: item.content,
          tags: item.tags,
          isPinned: false,
          isFavorite: false,
          isArchived: false,
          category: 'notes',
        });
        imported++;
      } catch (error) {
        errors++;
      }
    }

    setImportStats({ imported, skipped, errors });
    setIsImporting(false);
    
    if (errors === 0) {
      toast.success(`导入完成: ${imported} 个成功, ${skipped} 个跳过`);
      setTimeout(() => {
        setPreviewItems([]);
        onClose();
      }, 1500);
    }
  };

  // 切换选择
  const toggleSelection = (id: string) => {
    setPreviewItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // 全选/取消全选
  const toggleAll = (selected: boolean) => {
    setPreviewItems(items =>
      items.map(item => ({ ...item, selected }))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[700px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500">upload_file</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">导入笔记</h2>
              <p className="text-sm text-slate-500">支持 JSON、Markdown 格式</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setActiveTab('json'); setPreviewItems([]); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'json' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            JSON 导入
          </button>
          <button
            onClick={() => { setActiveTab('markdown'); setPreviewItems([]); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'markdown' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Markdown 导入
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 文件选择 */}
          {previewItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">
                  {activeTab === 'json' ? 'data_object' : 'description'}
                </span>
              </div>
              <p className="text-slate-500 mb-4">
                {activeTab === 'json' 
                  ? '选择 JSON 文件导入笔记数据' 
                  : '选择 Markdown 文件导入笔记'}
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl cursor-pointer hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined">folder_open</span>
                选择文件
                <input
                  type="file"
                  accept={activeTab === 'json' ? '.json' : '.md'}
                  multiple={activeTab === 'markdown'}
                  onChange={activeTab === 'json' ? handleJSONImport : handleMarkdownImport}
                  className="hidden"
                />
              </label>
              {activeTab === 'markdown' && (
                <p className="text-xs text-slate-400 mt-2">支持批量选择多个 .md 文件</p>
              )}
            </div>
          )}

          {/* 预览列表 */}
          {previewItems.length > 0 && (
            <div className="space-y-3">
              {/* 工具栏 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={previewItems.every(i => i.selected)}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    已选择 {previewItems.filter(i => i.selected).length} / {previewItems.length}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewItems([])}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  重新选择
                </button>
              </div>

              {/* 预览项 */}
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.selected
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-slate-700'
                  } ${item.conflict ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelection(item.id)}
                      className="w-4 h-4 rounded border-slate-300 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{item.title}</h3>
                        {item.conflict && (
                          <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                            已存在
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                        {item.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>来源: {item.source}</span>
                        {item.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-1">
                              {item.tags.map((tag, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 导入结果 */}
          {importStats && (
            <div className={`mt-4 p-4 rounded-xl ${
              importStats.errors > 0 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' 
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }`}>
              <h4 className="font-medium mb-2">导入结果</h4>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  成功: {importStats.imported}
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  跳过: {importStats.skipped}
                </span>
                {importStats.errors > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    失败: {importStats.errors}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {previewItems.length > 0 && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPreviewItems([])}
              className="px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={executeImport}
              disabled={isImporting || !previewItems.some(i => i.selected)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${isImporting ? 'animate-spin' : ''}`}>
                {isImporting ? 'sync' : 'download'}
              </span>
              {isImporting ? '导入中...' : '确认导入'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
