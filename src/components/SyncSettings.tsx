import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { syncService, AllSyncSettings, WebDAVConfig, GitConfig, LocalBackupConfig, SyncResult } from '../services/syncService';
import { useToast } from './Toast';
import { open } from '@tauri-apps/api/dialog';

interface SyncSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncSettings({ isOpen, onClose }: SyncSettingsProps) {
  const { t } = useTranslation();
  const { notes } = useNoteStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'webdav' | 'git' | 'local'>('local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  // WebDAV 配置
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig>({
    type: 'webdav',
    enabled: false,
    autoSync: false,
    syncInterval: 30,
    url: '',
    username: '',
    password: '',
    remotePath: '/memoplan_backup',
  });

  // Git 配置
  const [gitConfig, setGitConfig] = useState<GitConfig>({
    type: 'git',
    enabled: false,
    autoSync: false,
    syncInterval: 60,
    repositoryUrl: '',
    branch: 'main',
    username: '',
    token: '',
    commitMessage: 'Backup notes',
  });

  // 本地备份配置
  const [localConfig, setLocalConfig] = useState<LocalBackupConfig>({
    type: 'local',
    enabled: true,
    autoSync: true,
    syncInterval: 60,
    backupPath: '',
    maxBackups: 10,
  });

  // 加载配置
  useEffect(() => {
    const saved = localStorage.getItem('syncSettings');
    if (saved) {
      try {
        const config: AllSyncSettings = JSON.parse(saved);
        if (config.webdav) setWebdavConfig(config.webdav);
        if (config.git) setGitConfig(config.git);
        if (config.local) setLocalConfig(config.local);
      } catch (e) {
        console.error('加载同步配置失败:', e);
      }
    }
  }, []);

  // 保存配置
  const saveAllConfigs = () => {
    const allConfigs: AllSyncSettings = {
      webdav: webdavConfig,
      git: gitConfig,
      local: localConfig,
    };
    localStorage.setItem('syncSettings', JSON.stringify(allConfigs));
  };

  // 执行同步
  const handleSync = async () => {
    setIsSyncing(true);
    setLastResult(null);

    try {
      let result: SyncResult;

      switch (activeTab) {
        case 'webdav':
          result = await syncService.syncWithWebDAV(webdavConfig, notes);
          break;
        case 'git':
          result = await syncService.syncWithGit(gitConfig, notes);
          break;
        case 'local':
          result = await syncService.backupToLocal(localConfig, notes);
          break;
        default:
          throw new Error('未知的同步类型');
      }

      setLastResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`同步失败: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 导出 JSON
  const handleExportJSON = () => {
    try {
      const json = syncService.exportToJSON(notes);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoplan_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('toast.exportSuccess'));
    } catch (error) {
      toast.error(`导出失败: ${error}`);
    }
  };

  // 导入 JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedNotes = syncService.importFromJSON(json);
        // 这里可以添加导入逻辑
        toast.success(`${t('toast.importSuccess')}: ${importedNotes.length} 个笔记`);
      } catch (error) {
        toast.error(`导入失败: ${error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500">sync</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">数据同步与备份</h2>
              <p className="text-sm text-slate-500">配置同步方式，保护您的数据</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'local'
                ? 'bg-primary text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            本地备份
          </button>
          <button
            onClick={() => setActiveTab('webdav')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'webdav'
                ? 'bg-primary text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            WebDAV
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'git'
                ? 'bg-primary text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Git 同步
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 本地备份设置 */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">启用本地备份</p>
                  <p className="text-sm text-slate-500">自动备份到指定文件夹</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.enabled}
                    onChange={(e) => {
                      const newConfig = { ...localConfig, enabled: e.target.checked };
                      setLocalConfig(newConfig);
                      setTimeout(saveAllConfigs, 0);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">备份路径</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localConfig.backupPath}
                    onChange={(e) => setLocalConfig({ ...localConfig, backupPath: e.target.value })}
                    placeholder="选择备份文件夹..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                  <button
                    onClick={async () => {
                      try {
                        const selected = await open({
                          directory: true,
                          multiple: false,
                          title: '选择备份文件夹'
                        });
                        if (selected && typeof selected === 'string') {
                          setLocalConfig({ ...localConfig, backupPath: selected });
                          setTimeout(saveAllConfigs, 0);
                        }
                      } catch (error) {
                        console.error('选择文件夹失败:', error);
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm"
                  >
                    浏览
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">保留备份数量</label>
                <input
                  type="number"
                  value={localConfig.maxBackups}
                  onChange={(e) => setLocalConfig({ ...localConfig, maxBackups: parseInt(e.target.value) || 10 })}
                  min={1}
                  max={100}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* WebDAV 设置 */}
          {activeTab === 'webdav' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">启用 WebDAV 同步</p>
                  <p className="text-sm text-slate-500">同步到 WebDAV 服务器</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webdavConfig.enabled}
                    onChange={(e) => {
                      const newConfig = { ...webdavConfig, enabled: e.target.checked };
                      setWebdavConfig(newConfig);
                      setTimeout(saveAllConfigs, 0);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">服务器地址</label>
                <input
                  type="text"
                  value={webdavConfig.url}
                  onChange={(e) => setWebdavConfig({ ...webdavConfig, url: e.target.value })}
                  placeholder="https://example.com/webdav"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">用户名</label>
                  <input
                    type="text"
                    value={webdavConfig.username}
                    onChange={(e) => setWebdavConfig({ ...webdavConfig, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <input
                    type="password"
                    value={webdavConfig.password}
                    onChange={(e) => setWebdavConfig({ ...webdavConfig, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">远程路径</label>
                <input
                  type="text"
                  value={webdavConfig.remotePath}
                  onChange={(e) => setWebdavConfig({ ...webdavConfig, remotePath: e.target.value })}
                  placeholder="/memoplan_backup"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* Git 设置 */}
          {activeTab === 'git' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">启用 Git 同步</p>
                  <p className="text-sm text-slate-500">同步到 Git 仓库</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gitConfig.enabled}
                    onChange={(e) => {
                      const newConfig = { ...gitConfig, enabled: e.target.checked };
                      setGitConfig(newConfig);
                      setTimeout(saveAllConfigs, 0);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">仓库地址</label>
                <input
                  type="text"
                  value={gitConfig.repositoryUrl}
                  onChange={(e) => setGitConfig({ ...gitConfig, repositoryUrl: e.target.value })}
                  placeholder="https://github.com/username/repo.git"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">分支</label>
                <input
                  type="text"
                  value={gitConfig.branch}
                  onChange={(e) => setGitConfig({ ...gitConfig, branch: e.target.value })}
                  placeholder="main"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">用户名</label>
                  <input
                    type="text"
                    value={gitConfig.username}
                    onChange={(e) => setGitConfig({ ...gitConfig, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Token</label>
                  <input
                    type="password"
                    value={gitConfig.token}
                    onChange={(e) => setGitConfig({ ...gitConfig, token: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">提交信息</label>
                <input
                  type="text"
                  value={gitConfig.commitMessage}
                  onChange={(e) => setGitConfig({ ...gitConfig, commitMessage: e.target.value })}
                  placeholder="Backup notes"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* 导入导出 */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-medium mb-3">导入/导出</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                导出 JSON
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm cursor-pointer">
                <span className="material-symbols-outlined text-sm">upload</span>
                导入 JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 同步结果 */}
          {lastResult && (
            <div className={`p-3 rounded-lg ${
              lastResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
            }`}>
              <p className="text-sm">{lastResult.message}</p>
              {lastResult.details && (
                <p className="text-xs mt-1">
                  上传: {lastResult.details.uploaded}, 下载: {lastResult.details.downloaded}, 冲突: {lastResult.details.conflicts}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            关闭
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
              {isSyncing ? 'sync' : 'cloud_upload'}
            </span>
            {isSyncing ? '同步中...' : '立即同步'}
          </button>
        </div>
      </div>
    </div>
  );
}
