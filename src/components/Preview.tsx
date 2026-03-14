import { useEffect, useState } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { marked } from 'marked';
import { linkService } from '../services/linkService';

// 配置 marked 支持表格和任务列表
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 自定义 renderer 支持任务列表
const renderer = new marked.Renderer();
const originalListItem = renderer.listitem;
renderer.listitem = (text: string, task: boolean, checked: boolean) => {
  if (task) {
    return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${text}</li>`;
  }
  return originalListItem.call(renderer, text, task, checked);
};
marked.use({ renderer });

export default function Preview() {
  const { getCurrentNote, notes, setCurrentNote } = useNoteStore();
  const currentNote = getCurrentNote();
  const [content, setContent] = useState('');

  // 加载当前笔记内容
  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content);
    }
  }, [currentNote?.id, currentNote?.content]);

  // 渲染 Markdown 内容（支持双向链接）
  const renderMarkdown = (text: string) => {
    try {
      // 先处理双向链接
      const linkedContent = linkService.renderLinkedContent(text, notes);
      return marked(linkedContent);
    } catch (error) {
      console.error('Markdown 渲染错误:', error);
      return text;
    }
  };

  // 处理预览区域点击事件（用于双向链接跳转）
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest('.wiki-link') as HTMLAnchorElement;
    if (link) {
      e.preventDefault();
      const noteId = link.dataset.noteId;
      if (noteId) {
        setCurrentNote(noteId);
      }
    }
  };

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-bg)]">
        <div className="text-center text-[var(--text-secondary)]">
          <span className="material-symbols-outlined text-6xl mb-4">visibility</span>
          <p>选择笔记以预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      {/* 标题栏 */}
      <div className="px-4 h-12 border-b border-[var(--panel-border)] flex items-center">
        <span className="text-sm font-medium text-[var(--text-secondary)]">预览</span>
      </div>

      {/* 预览内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="prose dark:prose-invert max-w-none text-[var(--text-primary)]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          onClick={handlePreviewClick}
        />
      </div>
    </div>
  );
}
