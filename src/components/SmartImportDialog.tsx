import { useState, useCallback } from 'react';
import { processContent, ImportFormat, ContentStructure, generatePreview } from '../services/contentProcessor';
import { useToast } from './Toast';

interface SmartImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, format: ImportFormat) => void;
}

export default function SmartImportDialog({ isOpen, onClose, onImport }: SmartImportDialogProps) {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('markdown');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState('');
  const [structure, setStructure] = useState<ContentStructure | null>(null);
  const [processedContent, setProcessedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const toast = useToast();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      handleProcess(text, selectedFormat);
    };
    
    reader.readAsText(file);
  }, [selectedFormat]);

  const handleProcess = useCallback(async (text: string, format: ImportFormat) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    const result = await processContent(text, format);
    
    if (result.success) {
      setProcessedContent(result.content);
      setStructure(result.structure || null);
      setPreview(generatePreview(result.structure!));
      setShowPreview(true);
    } else {
      toast.error(result.error || '处理失败');
    }
    
    setIsProcessing(false);
  }, [toast]);

  const handleFormatChange = useCallback((format: ImportFormat) => {
    setSelectedFormat(format);
    if (content) {
      handleProcess(content, format);
    }
  }, [content, handleProcess]);

  const handleConfirmImport = useCallback(() => {
    if (processedContent) {
      onImport(processedContent, selectedFormat);
      toast.success('导入成功');
      onClose();
      // 重置状态
      setContent('');
      setFileName('');
      setPreview('');
      setStructure(null);
      setProcessedContent('');
      setShowPreview(false);
    }
  }, [processedContent, selectedFormat, onImport, onClose, toast]);

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      setContent(text);
      setFileName('剪贴板内容');
      handleProcess(text, selectedFormat);
    }).catch(() => {
      toast.error('无法读取剪贴板');
    });
  }, [selectedFormat, handleProcess, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[800px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">upload_file</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">智能导入</h2>
              <p className="text-sm text-slate-500">支持多种格式，自动识别与排版</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* 左侧：输入区 */}
          <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-700">
            {/* 上传区域 */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex gap-2 mb-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-slate-400">folder_open</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">选择文件</span>
                  <input
                    type="file"
                    accept=".txt,.md,.html,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handlePaste}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined">content_paste</span>
                  <span className="text-sm">粘贴</span>
                </button>
              </div>
              
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-primary">description</span>
                  {fileName}
                </div>
              )}
            </div>

            {/* 格式选择 */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                导入格式
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'original', label: '保持原样', desc: '自动识别格式' },
                  { key: 'markdown', label: 'Markdown', desc: '转为 Markdown' },
                  { key: 'richtext', label: '富文本', desc: '转为富文本' },
                  { key: 'plaintext', label: '纯文本', desc: '仅保留文字' },
                ].map((format) => (
                  <button
                    key={format.key}
                    onClick={() => handleFormatChange(format.key as ImportFormat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedFormat === format.key
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{format.label}</div>
                    <div className="text-xs text-slate-500">{format.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 原始内容预览 */}
            <div className="flex-1 flex flex-col p-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                原始内容
              </label>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (e.target.value) {
                    handleProcess(e.target.value, selectedFormat);
                  }
                }}
                placeholder="在此粘贴或输入内容..."
                className="flex-1 w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none text-sm focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>

          {/* 右侧：预览区 */}
          <div className="w-1/2 flex flex-col bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                智能排版预览
              </span>
              {isProcessing && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  处理中...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {showPreview ? (
                <div className="space-y-4">
                  {/* 内容结构概览 */}
                  {structure && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-medium text-slate-500 mb-2">内容结构</h4>
                      <div className="flex flex-wrap gap-2">
                        {structure.headings.length > 0 && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {structure.headings.length} 个标题
                          </span>
                        )}
                        {structure.paragraphs.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                            {structure.paragraphs.length} 个段落
                          </span>
                        )}
                        {structure.lists.length > 0 && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                            {structure.lists.reduce((sum, l) => sum + l.items.length, 0)} 个列表项
                          </span>
                        )}
                        {structure.codeBlocks.length > 0 && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                            {structure.codeBlocks.length} 个代码块
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 预览内容 */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-medium text-slate-500 mb-2">预览</h4>
                    <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {preview}
                    </pre>
                  </div>

                  {/* 处理后内容 */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-medium text-slate-500 mb-2">处理结果（前500字）</h4>
                    <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {processedContent.slice(0, 500)}
                      {processedContent.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">auto_fix_high</span>
                  <p className="text-sm">上传或粘贴内容后查看智能排版预览</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!processedContent || isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            确认导入
          </button>
        </div>
      </div>
    </div>
  );
}
