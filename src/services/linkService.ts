import { Note } from '../types';

// 双向链接格式: [[笔记标题]] 或 [[笔记标题|显示文本]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface NoteLink {
  sourceId: string;
  targetId: string | null;
  targetTitle: string;
  displayText: string;
  position: number;
}

export interface Backlink {
  noteId: string;
  noteTitle: string;
  context: string;
  lineNumber: number;
}

export interface NoteGraphNode {
  id: string;
  title: string;
  color?: string;
  isPinned: boolean;
  isFavorite: boolean;
}

export interface NoteGraphEdge {
  source: string;
  target: string;
}

export const linkService = {
  // 解析笔记内容中的所有双向链接
  parseWikiLinks(content: string, sourceNoteId: string): NoteLink[] {
    const links: NoteLink[] = [];
    let match;

    while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
      const targetTitle = match[1].trim();
      const displayText = match[2] ? match[2].trim() : targetTitle;
      
      links.push({
        sourceId: sourceNoteId,
        targetId: null, // 将在匹配笔记后填充
        targetTitle,
        displayText,
        position: match.index,
      });
    }

    return links;
  },

  // 匹配链接到实际笔记
  resolveLinks(links: NoteLink[], notes: Note[]): NoteLink[] {
    return links.map(link => {
      const targetNote = notes.find(
        n => n.title.toLowerCase() === link.targetTitle.toLowerCase() && !n.isDeleted
      );
      return {
        ...link,
        targetId: targetNote?.id || null,
      };
    });
  },

  // 获取笔记的所有反向链接
  getBacklinks(noteId: string, noteTitle: string, allNotes: Note[]): Backlink[] {
    const backlinks: Backlink[] = [];

    allNotes.forEach(note => {
      if (note.id === noteId || note.isDeleted) return;

      const lines = note.content.split('\n');
      lines.forEach((line, index) => {
        // 检查是否包含对该笔记的链接
        const linkPattern = new RegExp(`\\[\\[${noteTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'i');
        if (linkPattern.test(line)) {
          backlinks.push({
            noteId: note.id,
            noteTitle: note.title,
            context: line.trim(),
            lineNumber: index + 1,
          });
        }
      });
    });

    return backlinks;
  },

  // 构建笔记图谱数据
  buildGraphData(notes: Note[]): { nodes: NoteGraphNode[]; edges: NoteGraphEdge[] } {
    const nodes: NoteGraphNode[] = notes
      .filter(n => !n.isDeleted)
      .map(n => ({
        id: n.id,
        title: n.title,
        color: n.color,
        isPinned: n.isPinned,
        isFavorite: n.isFavorite,
      }));

    const edges: NoteGraphEdge[] = [];
    const edgeSet = new Set<string>();

    notes.forEach(note => {
      if (note.isDeleted) return;

      const links = linkService.parseWikiLinks(note.content, note.id);
      const resolvedLinks = linkService.resolveLinks(links, notes);

      resolvedLinks.forEach(link => {
        if (link.targetId) {
          // 创建唯一边标识符（避免重复）
          const edgeId = [link.sourceId, link.targetId].sort().join('-');
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            edges.push({
              source: link.sourceId,
              target: link.targetId,
            });
          }
        }
      });
    });

    return { nodes, edges };
  },

  // 渲染带链接的内容（将 [[标题]] 转换为可点击链接）
  renderLinkedContent(content: string, notes: Note[]): string {
    return content.replace(WIKI_LINK_REGEX, (_match, title, displayText) => {
      const targetNote = notes.find(
        n => n.title.toLowerCase() === title.trim().toLowerCase() && !n.isDeleted
      );
      
      if (targetNote) {
        const text = displayText ? displayText.trim() : title.trim();
        return `<a href="#note-${targetNote.id}" class="wiki-link" data-note-id="${targetNote.id}">${text}</a>`;
      }
      
      // 如果目标笔记不存在，显示为未链接
      const text = displayText ? displayText.trim() : title.trim();
      return `<span class="wiki-link-unresolved" title="笔记不存在">${text}</span>`;
    });
  },

  // 获取未链接的引用（文本中提到的笔记标题但没有使用 [[ ]]）
  getUnlinkedMentions(noteId: string, noteTitle: string, allNotes: Note[]): Backlink[] {
    const mentions: Backlink[] = [];

    allNotes.forEach(note => {
      if (note.id === noteId || note.isDeleted) return;

      const lines = note.content.split('\n');
      lines.forEach((line, index) => {
        // 排除已经使用 [[ ]] 链接的情况
        const linkPattern = new RegExp(`\\[\\[${noteTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'i');
        if (linkPattern.test(line)) return;

        // 检查是否提到笔记标题
        const mentionPattern = new RegExp(`\\b${noteTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (mentionPattern.test(line)) {
          mentions.push({
            noteId: note.id,
            noteTitle: note.title,
            context: line.trim(),
            lineNumber: index + 1,
          });
        }
      });
    });

    return mentions;
  },

  // 自动链接：将文本中的笔记标题转换为 [[标题]]
  autoLinkContent(content: string, allNotes: Note[]): string {
    let newContent = content;

    // 按标题长度降序排序，避免短标题匹配到长标题中
    const sortedNotes = [...allNotes]
      .filter(n => !n.isDeleted)
      .sort((a, b) => b.title.length - a.title.length);

    sortedNotes.forEach(note => {
      // 跳过已经链接的
      const alreadyLinkedPattern = new RegExp(`\\[\\[[^\]]*${note.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\]]*\\]\\]`, 'gi');
      if (alreadyLinkedPattern.test(newContent)) return;

      // 替换未链接的提及
      const mentionPattern = new RegExp(`(?<!\\[)\\b${note.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?!\\])`, 'gi');
      newContent = newContent.replace(mentionPattern, `[[${note.title}]]`);
    });

    return newContent;
  },
};
