const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  // 检查 preload 脚本是否存在
  const preloadPath = path.join(__dirname, 'electron-preload.cjs');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // 加载构建好的前端应用
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading index from:', indexPath);
  console.log('Index exists:', fs.existsSync(indexPath));
  
  mainWindow.loadFile(indexPath);

  // 监听加载失败
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // 监听控制台消息
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Console:', level, message);
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // 打开开发者工具以便调试
    mainWindow.webContents.openDevTools();
  });

  // 创建菜单
  createMenu();
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建笔记',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-note');
          }
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: '所有支持的格式', extensions: ['md', 'txt', 'json', 'html', 'doc', 'docx', 'pdf', 'rtf', 'xml', 'csv'] },
                { name: 'Markdown', extensions: ['md', 'markdown'] },
                { name: '文本文件', extensions: ['txt'] },
                { name: 'Word 文档', extensions: ['doc', 'docx'] },
                { name: 'PDF 文档', extensions: ['pdf'] },
                { name: 'HTML 文件', extensions: ['html', 'htm'] },
                { name: 'JSON 文件', extensions: ['json'] },
                { name: '富文本格式', extensions: ['rtf'] },
                { name: 'XML 文件', extensions: ['xml'] },
                { name: 'CSV 文件', extensions: ['csv'] },
                { name: '所有文件', extensions: ['*'] }
              ]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
            }
          }
        },
        {
          label: '导入',
          submenu: [
            {
              label: '导入 Markdown',
              click: () => mainWindow.webContents.send('menu-import', 'markdown')
            },
            {
              label: '导入 TXT',
              click: () => mainWindow.webContents.send('menu-import', 'txt')
            },
            {
              label: '导入 JSON',
              click: () => mainWindow.webContents.send('menu-import', 'json')
            },
            {
              label: '导入 HTML',
              click: () => mainWindow.webContents.send('menu-import', 'html')
            },
            {
              label: '导入 Word',
              click: () => mainWindow.webContents.send('menu-import', 'doc')
            },
            {
              label: '智能导入...',
              click: () => mainWindow.webContents.send('menu-smart-import')
            }
          ]
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [
                { name: 'Markdown', extensions: ['md'] },
                { name: '文本文件', extensions: ['txt'] },
                { name: 'HTML', extensions: ['html'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'Word 文档', extensions: ['doc'] },
                { name: 'PDF', extensions: ['pdf'] },
                { name: 'RTF', extensions: ['rtf'] },
                { name: 'XML', extensions: ['xml'] },
                { name: 'CSV', extensions: ['csv'] }
              ]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-save-as', result.filePath);
            }
          }
        },
        {
          label: '导出',
          submenu: [
            { label: '导出为 Markdown', click: () => mainWindow.webContents.send('menu-export', 'md') },
            { label: '导出为 TXT', click: () => mainWindow.webContents.send('menu-export', 'txt') },
            { label: '导出为 HTML', click: () => mainWindow.webContents.send('menu-export', 'html') },
            { label: '导出为 JSON', click: () => mainWindow.webContents.send('menu-export', 'json') },
            { label: '导出为 PDF', click: () => mainWindow.webContents.send('menu-export', 'pdf') },
            { label: '导出为 Word', click: () => mainWindow.webContents.send('menu-export', 'doc') },
            { label: '导出为 RTF', click: () => mainWindow.webContents.send('menu-export', 'rtf') }
          ]
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectall', label: '全选' },
        { type: 'separator' },
        {
          label: '查找',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('menu-find')
        },
        {
          label: '替换',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow.webContents.send('menu-replace')
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '切换全屏',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        { type: 'separator' },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            mainWindow.webContents.send('menu-zoom-in');
          }
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow.webContents.send('menu-zoom-out');
          }
        },
        {
          label: '重置缩放',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.send('menu-zoom-reset');
          }
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: '笔记',
      submenu: [
        {
          label: '新建笔记',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow.webContents.send('menu-new-note')
        },
        {
          label: '删除笔记',
          click: () => mainWindow.webContents.send('menu-delete-note')
        },
        { type: 'separator' },
        {
          label: '置顶/取消置顶',
          click: () => mainWindow.webContents.send('menu-toggle-pin')
        },
        {
          label: '收藏/取消收藏',
          click: () => mainWindow.webContents.send('menu-toggle-favorite')
        },
        {
          label: '归档/取消归档',
          click: () => mainWindow.webContents.send('menu-toggle-archive')
        },
        { type: 'separator' },
        {
          label: '一键生成待办',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('menu-convert-tasks')
        },
        {
          label: 'AI 助手',
          click: () => mainWindow.webContents.send('menu-ai-assistant')
        }
      ]
    },
    {
      label: '工具',
      submenu: [
        {
          label: '搜索',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => mainWindow.webContents.send('menu-search')
        },
        {
          label: '笔记图谱',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => mainWindow.webContents.send('menu-graph')
        },
        {
          label: '标签管理',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => mainWindow.webContents.send('menu-tags')
        },
        { type: 'separator' },
        {
          label: '导入...',
          click: () => mainWindow.webContents.send('menu-import-dialog')
        },
        {
          label: '同步设置',
          click: () => mainWindow.webContents.send('menu-sync')
        },
        {
          label: '回收站',
          click: () => mainWindow.webContents.send('menu-trash')
        }
      ]
    },
    {
      label: '设置',
      submenu: [
        {
          label: '通用设置',
          click: () => mainWindow.webContents.send('menu-settings-general')
        },
        {
          label: '外观设置',
          click: () => mainWindow.webContents.send('menu-settings-appearance')
        },
        {
          label: '语言',
          submenu: [
            { label: '简体中文', click: () => mainWindow.webContents.send('menu-language', 'zh-CN') },
            { label: '繁體中文', click: () => mainWindow.webContents.send('menu-language', 'zh-TW') },
            { label: 'English', click: () => mainWindow.webContents.send('menu-language', 'en') }
          ]
        },
        {
          label: '主题',
          submenu: [
            { label: '浅色', click: () => mainWindow.webContents.send('menu-theme', 'light') },
            { label: '深色', click: () => mainWindow.webContents.send('menu-theme', 'dark') },
            { label: '跟随系统', click: () => mainWindow.webContents.send('menu-theme', 'auto') }
          ]
        },
        { type: 'separator' },
        {
          label: '设置...',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('menu-settings')
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用指南',
          click: () => mainWindow.webContents.send('menu-help')
        },
        {
          label: '快捷键',
          click: () => mainWindow.webContents.send('menu-shortcuts')
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 MemoPlan',
              message: 'MemoPlan v1.0.0',
              detail: '桌面备忘录 + Markdown 笔记 + 学习待办规划工具'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC 处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
