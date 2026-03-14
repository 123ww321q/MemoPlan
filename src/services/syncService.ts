import { Note } from '../types';
import { invoke } from '@tauri-apps/api/tauri';

export interface SyncConfig {
  type: 'webdav' | 'git' | 'local';
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // 分钟
  lastSyncTime?: number;
}

export interface WebDAVConfig extends SyncConfig {
  type: 'webdav';
  url: string;
  username: string;
  password: string;
  remotePath: string;
}

export interface GitConfig extends SyncConfig {
  type: 'git';
  repositoryUrl: string;
  branch: string;
  username: string;
  token: string;
  commitMessage: string;
}

export interface LocalBackupConfig extends SyncConfig {
  type: 'local';
  backupPath: string;
  maxBackups: number;
}

export type AllSyncSettings = {
  webdav?: WebDAVConfig;
  git?: GitConfig;
  local?: LocalBackupConfig;
};

export type SyncSettings = WebDAVConfig | GitConfig | LocalBackupConfig;

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: number;
  details?: {
    uploaded: number;
    downloaded: number;
    conflicts: number;
  };
}

// 同步服务
export const syncService = {
  // 获取数据目录路径
  async getDataPath(): Promise<string> {
    try {
      return await invoke('get_data_dir');
    } catch (error) {
      console.error('获取数据目录失败:', error);
      throw error;
    }
  },

  // WebDAV 同步
  async syncWithWebDAV(config: WebDAVConfig, notes: Note[]): Promise<SyncResult> {
    try {
      // 将笔记数据序列化为 JSON
      const data = JSON.stringify(notes, null, 2);
      const timestamp = Date.now();
      const filename = `notes_backup_${timestamp}.json`;

      // 调用 Tauri 后端进行 WebDAV 同步
      const result = await invoke<SyncResult>('sync_webdav', {
        url: config.url,
        username: config.username,
        password: config.password,
        remotePath: `${config.remotePath}/${filename}`,
        data,
      });

      return result;
    } catch (error) {
      console.error('WebDAV 同步失败:', error);
      return {
        success: false,
        message: `同步失败: ${error}`,
        timestamp: Date.now(),
      };
    }
  },

  // Git 同步
  async syncWithGit(config: GitConfig, notes: Note[]): Promise<SyncResult> {
    try {
      const data = JSON.stringify(notes, null, 2);

      const result = await invoke<SyncResult>('sync_git', {
        repoUrl: config.repositoryUrl,
        branch: config.branch,
        username: config.username,
        token: config.token,
        commitMessage: config.commitMessage || `Backup notes at ${new Date().toISOString()}`,
        data,
      });

      return result;
    } catch (error) {
      console.error('Git 同步失败:', error);
      return {
        success: false,
        message: `Git 同步失败: ${error}`,
        timestamp: Date.now(),
      };
    }
  },

  // 本地备份
  async backupToLocal(config: LocalBackupConfig, notes: Note[]): Promise<SyncResult> {
    try {
      const data = JSON.stringify(notes, null, 2);
      const filename = `notes_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      const result = await invoke<SyncResult>('backup_local', {
        backupPath: config.backupPath,
        filename,
        data,
        maxBackups: config.maxBackups || 10,
      });

      return result;
    } catch (error) {
      console.error('本地备份失败:', error);
      return {
        success: false,
        message: `备份失败: ${error}`,
        timestamp: Date.now(),
      };
    }
  },

  // 导出笔记为 JSON
  exportToJSON(notes: Note[]): string {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      notes: notes.filter(n => !n.isDeleted),
    };
    return JSON.stringify(exportData, null, 2);
  },

  // 从 JSON 导入笔记
  importFromJSON(json: string): Note[] {
    try {
      const data = JSON.parse(json);
      if (data.notes && Array.isArray(data.notes)) {
        return data.notes.map((note: Partial<Note>) => ({
          ...note,
          id: note.id || crypto.randomUUID(),
          createdAt: note.createdAt || Date.now(),
          updatedAt: Date.now(),
        })) as Note[];
      }
      throw new Error('无效的备份文件格式');
    } catch (error) {
      console.error('导入失败:', error);
      throw error;
    }
  },

  // 导出为 Markdown 文件
  exportToMarkdown(note: Note): string {
    const frontmatter = `---
title: ${note.title}
created: ${new Date(note.createdAt).toISOString()}
updated: ${new Date(note.updatedAt).toISOString()}
tags: ${note.tags?.join(', ') || ''}
pinned: ${note.isPinned}
favorite: ${note.isFavorite}
---

`;
    return frontmatter + note.content;
  },

  // 检查自动备份
  shouldAutoBackup(config: SyncConfig): boolean {
    if (!config.enabled || !config.autoSync) return false;
    if (!config.lastSyncTime) return true;

    const intervalMs = config.syncInterval * 60 * 1000;
    return Date.now() - config.lastSyncTime > intervalMs;
  },
};
