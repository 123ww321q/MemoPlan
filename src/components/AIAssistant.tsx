import { useState, useCallback } from 'react';
import { getAIService, AIRequest } from '../services/aiService';
import { useToast } from './Toast';

interface AIAssistantProps {
  currentContent: string;
  selectedText: string;
  onInsertContent: (content: string) => void;
}

type AIAction = 'summarize' | 'polish' | 'expand' | 'condense' | 'extract-tasks' | 'organize' | 'custom';

interface AIActionOption {
  key: AIAction;
  label: string;
  icon: string;
  description: string;
}

const aiActions: AIActionOption[] = [
  { key: 'summarize', label: '摘要', icon: 'summarize', description: '生成内容摘要' },
  { key: 'polish', label: '润色', icon: 'auto_fix_high', description: '优化文字表达' },
  { key: 'expand', label: '扩写', icon: 'add_circle', description: '增加细节内容' },
  { key: 'condense', label: '精简', icon: 'remove_circle', description: '去除冗余信息' },
  { key: 'extract-tasks', label: '提取待办', icon: 'checklist', description: '提取待办事项' },
  { key: 'organize', label: '整理', icon: 'sort', description: '结构化整理' },
];

export default function AIAssistant({ currentContent, selectedText, onInsertContent }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const toast = useToast();


  const handleAction = useCallback(async (action: AIAction) => {
    const contentToProcess = selectedText || currentContent;
    
    if (!contentToProcess.trim()) {
      toast.warning('请先输入或选择要处理的内容');
      return;
    }

    setIsProcessing(true);
    setResult('');
    setStreamingText('');

    try {
      const aiService = getAIService();
      const request: AIRequest = {
        content: contentToProcess,
        action,
        context: currentContent !== contentToProcess ? currentContent : undefined,
        customPrompt: action === 'custom' ? customPrompt : undefined,
      };

      // 使用流式输出
      const stream = aiService.processStream(request);
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingText(fullText);
      }

      setResult(fullText);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '处理失败');
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, selectedText, customPrompt, toast]);

  const handleInsert = useCallback(() => {
    const textToInsert = result || streamingText;
    if (textToInsert) {
      onInsertContent(textToInsert);
      toast.success('已插入到笔记');
      setResult('');
      setStreamingText('');
    }
  }, [result, streamingText, onInsertContent, toast]);

  const handleCopy = useCallback(() => {
    const textToCopy = result || streamingText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success('已复制到剪贴板');
    }
  }, [result, streamingText, toast]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center group"
        title="AI 助手"
      >
        <span className="material-symbols-outlined text-2xl">smart_toy</span>
        <span className="absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI 助手
        </span>
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">AI 助手</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-slate-500">close</span>
        </button>
      </div>

      {/* 操作按钮 */}
      <div className="p-3 grid grid-cols-3 gap-2">
        {aiActions.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.key)}
            disabled={isProcessing}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-primary">{action.icon}</span>
            <span className="text-xs text-slate-600 dark:text-slate-400">{action.label}</span>
          </button>
        ))}
      </div>

      {/* 自定义指令 */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm text-slate-500 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          自定义指令
        </button>
        
        {showCustomInput && (
          <div className="mt-2 space-y-2">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="输入自定义指令，例如：将以下内容翻译成英文"
              className="w-full h-20 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <button
              onClick={() => handleAction('custom')}
              disabled={isProcessing || !customPrompt.trim()}
              className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              执行自定义指令
            </button>
          </div>
        )}
      </div>

      {/* 处理状态 */}
      {isProcessing && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined animate-spin">sync</span>
            AI 正在处理...
          </div>
        </div>
      )}

      {/* 结果展示 */}
      {(result || streamingText) && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <div className="p-3">
            <div className="text-xs text-slate-500 mb-2">处理结果：</div>
            <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {streamingText || result}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2 p-3 pt-0">
            <button
              onClick={handleInsert}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              插入笔记
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              复制
            </button>
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <p className="text-[10px] text-slate-400 text-center">
          {selectedText ? `已选择 ${selectedText.length} 个字符` : '处理整个笔记内容'}
        </p>
      </div>
    </div>
  );
}
