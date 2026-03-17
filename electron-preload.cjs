const { contextBridge, ipcRenderer } = require('electron');

// 帮助函数：创建可清理的事件监听
const createEventListener = (channel) => {
  return (callback) => {
    const wrappedCallback = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, wrappedCallback);
    // 返回清理函数
    return () => ipcRenderer.removeListener(channel, wrappedCallback);
  };
};

// 暴露安全的 API 给前端
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件菜单
  onMenuNewNote: createEventListener('menu-new-note'),
  onMenuOpenFile: createEventListener('menu-open-file'),
  onMenuImport: createEventListener('menu-import'),
  onMenuSmartImport: createEventListener('menu-smart-import'),
  onMenuSave: createEventListener('menu-save'),
  onMenuSaveAs: createEventListener('menu-save-as'),
  onMenuExport: createEventListener('menu-export'),
  
  // 笔记菜单
  onMenuDeleteNote: createEventListener('menu-delete-note'),
  onMenuTogglePin: createEventListener('menu-toggle-pin'),
  onMenuToggleFavorite: createEventListener('menu-toggle-favorite'),
  onMenuToggleArchive: createEventListener('menu-toggle-archive'),
  onMenuConvertTasks: createEventListener('menu-convert-tasks'),
  onMenuAIAssistant: createEventListener('menu-ai-assistant'),
  
  // 工具菜单
  onMenuSearch: createEventListener('menu-search'),
  onMenuGraph: createEventListener('menu-graph'),
  onMenuTags: createEventListener('menu-tags'),
  onMenuImportDialog: createEventListener('menu-import-dialog'),
  onMenuSync: createEventListener('menu-sync'),
  onMenuTrash: createEventListener('menu-trash'),
  
  // 设置菜单
  onMenuSettings: createEventListener('menu-settings'),
  onMenuSettingsGeneral: createEventListener('menu-settings-general'),
  onMenuSettingsAppearance: createEventListener('menu-settings-appearance'),
  onMenuLanguage: createEventListener('menu-language'),
  onMenuTheme: createEventListener('menu-theme'),
  
  // 帮助菜单
  onMenuHelp: createEventListener('menu-help'),
  onMenuShortcuts: createEventListener('menu-shortcuts'),
  
  // 视图菜单
  onMenuFind: createEventListener('menu-find'),
  onMenuReplace: createEventListener('menu-replace'),
  onMenuZoomIn: createEventListener('menu-zoom-in'),
  onMenuZoomOut: createEventListener('menu-zoom-out'),
  onMenuZoomReset: createEventListener('menu-zoom-reset'),
  
  // IPC 调用
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
});
