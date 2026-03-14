// 内容处理服务 - 智能排版和格式转换

export type ImportFormat = 'original' | 'markdown' | 'richtext' | 'plaintext';

export interface ContentStructure {
  title?: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  lists: Array<{ type: 'ul' | 'ol'; items: string[] }>;
  codeBlocks: Array<{ language?: string; code: string }>;
  images: Array<{ src: string; alt?: string }>;
}

export interface ProcessResult {
  success: boolean;
  content: string;
  format: ImportFormat;
  structure?: ContentStructure;
  error?: string;
}

// 检测内容类型
export function detectContentType(content: string): 'markdown' | 'html' | 'plaintext' {
  // 检测 Markdown
  if (/^#{1,6}\s/.test(content) || /\[.+\]\(.+\)/.test(content) || /\*\*|__/.test(content)) {
    return 'markdown';
  }
  
  // 检测 HTML
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return 'html';
  }
  
  return 'plaintext';
}

// 智能排版 - 自动整理内容结构
export function smartFormat(content: string): string {
  let formatted = content;

  // 1. 规范化换行
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 2. 去除多余空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // 3. 自动识别标题
  // 如果一行很短且后面有空行，可能是标题
  formatted = formatted.replace(/^(\S.{0,50}\S)\n\n/gm, (match, line) => {
    if (line.length < 30 && !line.match(/[。，；：]$/)) {
      return `## ${line}\n\n`;
    }
    return match;
  });
  
  // 4. 自动识别列表
  // 数字开头或特定符号开头的行
  formatted = formatted.replace(/^(\d+[.、]\s*.+)$/gm, '- $1');
  
  // 5. 规范化段落
  formatted = formatted.replace(/([^\n])\n([^\n#\-\*\d])/g, '$1 $2');
  
  // 6. 自动添加空格
  // 中英文之间添加空格
  formatted = formatted.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');
  formatted = formatted.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
  
  // 7. 规范化标点
  // 中文标点后面添加空格（如果后面是英文）
  formatted = formatted.replace(/([，。；：！？])([a-zA-Z])/g, '$1 $2');
  
  return formatted.trim();
}

// 转换为 Markdown
export function convertToMarkdown(content: string, sourceType: 'html' | 'plaintext'): string {
  if (sourceType === 'html') {
    // 简单的 HTML 到 Markdown 转换
    return content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
        let index = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
      })
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
  }
  
  // 纯文本转 Markdown
  return smartFormat(content);
}

// 转换为富文本 HTML
export function convertToRichText(content: string, sourceType: 'markdown' | 'plaintext'): string {
  if (sourceType === 'markdown') {
    // 简单的 Markdown 到 HTML 转换
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }
  
  // 纯文本转 HTML
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('## ')) return `<h2>${match.slice(3)}</h2>`;
      if (match.startsWith('# ')) return `<h1>${match.slice(2)}</h1>`;
      return match;
    });
}

// 提取纯文本
export function extractPlainText(content: string): string {
  return content
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/\n+/g, '\n')
    .trim();
}

// 分析内容结构
export function analyzeStructure(content: string): ContentStructure {
  const structure: ContentStructure = {
    headings: [],
    paragraphs: [],
    lists: [],
    codeBlocks: [],
    images: [],
  };

  // 提取标题
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    structure.headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }

  // 提取段落
  const paragraphs = content.split(/\n\n+/);
  structure.paragraphs = paragraphs
    .filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('-') && !p.startsWith('```'))
    .map(p => p.trim());

  // 提取列表
  const listRegex = /^(-|\d+[.])\s+(.+)$/gm;
  const listItems: Array<{ type: 'ul' | 'ol'; text: string }> = [];
  while ((match = listRegex.exec(content)) !== null) {
    listItems.push({
      type: match[1] === '-' ? 'ul' : 'ol',
      text: match[2].trim(),
    });
  }
  
  // 分组列表项
  if (listItems.length > 0) {
    let currentType = listItems[0].type;
    let currentItems: string[] = [];
    
    for (const item of listItems) {
      if (item.type !== currentType && currentItems.length > 0) {
        structure.lists.push({ type: currentType, items: [...currentItems] });
        currentItems = [];
      }
      currentType = item.type;
      currentItems.push(item.text);
    }
    
    if (currentItems.length > 0) {
      structure.lists.push({ type: currentType, items: currentItems });
    }
  }

  // 提取代码块
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    structure.codeBlocks.push({
      language: match[1],
      code: match[2].trim(),
    });
  }

  // 提取图片
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = imageRegex.exec(content)) !== null) {
    structure.images.push({
      alt: match[1],
      src: match[2],
    });
  }

  // 设置标题
  if (structure.headings.length > 0) {
    structure.title = structure.headings[0].text;
  }

  return structure;
}

// 主处理函数
export async function processContent(
  content: string,
  targetFormat: ImportFormat
): Promise<ProcessResult> {
  try {
    const sourceType = detectContentType(content);
    let processedContent = content;
    let finalFormat: ImportFormat = targetFormat;

    switch (targetFormat) {
      case 'markdown':
        if (sourceType === 'html') {
          processedContent = convertToMarkdown(content, 'html');
        } else if (sourceType === 'plaintext') {
          processedContent = convertToMarkdown(content, 'plaintext');
        }
        // 应用智能排版
        processedContent = smartFormat(processedContent);
        break;

      case 'richtext':
        if (sourceType === 'markdown') {
          processedContent = convertToRichText(content, 'markdown');
        } else {
          processedContent = convertToRichText(smartFormat(content), 'plaintext');
        }
        break;

      case 'plaintext':
        processedContent = extractPlainText(content);
        break;

      case 'original':
      default:
        // 保持原样，但应用基本的智能排版
        processedContent = smartFormat(content);
        finalFormat = sourceType === 'html' ? 'richtext' : sourceType;
        break;
    }

    const structure = analyzeStructure(processedContent);

    return {
      success: true,
      content: processedContent,
      format: finalFormat,
      structure,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      format: targetFormat,
      error: error instanceof Error ? error.message : '处理失败',
    };
  }
}

// 预览处理结果
export function generatePreview(structure: ContentStructure): string {
  const parts: string[] = [];

  if (structure.title) {
    parts.push(`# ${structure.title}\n`);
  }

  if (structure.headings.length > 1) {
    parts.push('## 目录结构\n');
    structure.headings.forEach(h => {
      parts.push(`${'  '.repeat(h.level - 1)}- ${h.text}`);
    });
    parts.push('');
  }

  if (structure.paragraphs.length > 0) {
    parts.push(`## 段落 (${structure.paragraphs.length} 个)\n`);
    parts.push(structure.paragraphs.slice(0, 2).join('\n\n'));
    if (structure.paragraphs.length > 2) {
      parts.push(`... 还有 ${structure.paragraphs.length - 2} 个段落`);
    }
    parts.push('');
  }

  if (structure.lists.length > 0) {
    parts.push(`## 列表 (${structure.lists.length} 个)\n`);
    structure.lists.forEach((list, i) => {
      parts.push(`列表 ${i + 1} (${list.type === 'ul' ? '无序' : '有序'}):`);
      list.items.slice(0, 3).forEach(item => {
        parts.push(`- ${item}`);
      });
      if (list.items.length > 3) {
        parts.push(`... 还有 ${list.items.length - 3} 项`);
      }
      parts.push('');
    });
  }

  if (structure.codeBlocks.length > 0) {
    parts.push(`## 代码块 (${structure.codeBlocks.length} 个)\n`);
    structure.codeBlocks.forEach((block, i) => {
      parts.push(`代码块 ${i + 1}${block.language ? ` (${block.language})` : ''}:`);
      parts.push('```');
      parts.push(block.code.slice(0, 100) + (block.code.length > 100 ? '...' : ''));
      parts.push('```\n');
    });
  }

  return parts.join('\n');
}

export default {
  processContent,
  smartFormat,
  detectContentType,
  analyzeStructure,
  generatePreview,
};
