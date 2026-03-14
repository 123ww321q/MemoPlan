import { Task } from '../types';

export class MarkdownParser {
  static parseToTasks(markdown: string, noteId: string): Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] {
    const lines = markdown.split('\n');
    const tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    let currentLevel = 0;

    lines.forEach((line, index) => {
      // 识别标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        currentLevel = headingMatch[1].length - 1;
        return;
      }

      // 识别任务复选框
      const checkboxMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)$/);
      if (checkboxMatch) {
        const indent = checkboxMatch[1].length;
        const completed = checkboxMatch[2].toLowerCase() === 'x';
        const title = checkboxMatch[3];

        const { cleanTitle, priority, dueDate } = this.extractMetadata(title);

        tasks.push({
          noteId,
          title: cleanTitle,
          completed,
          priority,
          dueDate,
          level: currentLevel + Math.floor(indent / 2) + 1,
          order: index,
        });
      }
    });

    return tasks;
  }

  private static extractMetadata(title: string): {
    cleanTitle: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: number;
  } {
    let cleanTitle = title;
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let dueDate: number | undefined;

    // 提取优先级
    if (title.includes('❗') || title.includes('!!')) {
      priority = 'high';
      cleanTitle = cleanTitle.replace(/[❗!]/g, '').trim();
    } else if (title.includes('⚠️')) {
      priority = 'medium';
      cleanTitle = cleanTitle.replace(/⚠️/g, '').trim();
    }

    // 提取日期 @YYYY-MM-DD
    const dateMatch = title.match(/@(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      dueDate = new Date(dateMatch[1]).getTime();
      cleanTitle = cleanTitle.replace(/@\d{4}-\d{2}-\d{2}/, '').trim();
    }

    return { cleanTitle, priority, dueDate };
  }

  static countWords(markdown: string): number {
    const text = markdown.replace(/[#*`\[\]()]/g, '');
    const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g);
    return words ? words.length : 0;
  }
}
