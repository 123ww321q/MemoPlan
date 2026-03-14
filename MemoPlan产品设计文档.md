# MemoPlan 产品功能设计文档

## 产品定位
MemoPlan 是一款"桌面便签 + Markdown 笔记 + 学习待办规划工具"，专为 Windows 平台设计，轻量、现代、易上手。

---

## 一、产品功能清单

### 1.1 桌面备忘录功能
- 新建、编辑、删除、归档便签
- 便签列表管理（列表视图、卡片视图）
- 置顶、收藏、搜索功能
- 标签分类管理
- 快速创建（全局快捷键）
- 最近便签快速访问
- 自动保存（实时保存）

### 1.2 Markdown 编辑功能
- 基础语法支持：标题、列表、复选框、引用、代码块、分割线、粗体、斜体
- 实时预览
- 编辑/预览双栏模式
- 导入/导出 Markdown 文件
- 模板系统：
  - 学习计划模板
  - 课程安排模板
  - 读书笔记模板
  - 复习计划模板
  - 工作清单模板

### 1.3 Markdown 转待办任务（核心功能）
- 自动识别任务格式：
  - `- [ ]` 未完成任务
  - `- [x]` 已完成任务
  - 普通无序列表 `-`
  - 有序列表 `1.`
  - 标题层级作为任务分组
- 任务字段：
  - 标题
  - 完成状态
  - 优先级（High/Medium/Low）
  - 截止时间
  - 所属笔记
  - 层级关系
- 一键生成待办
- 实时同步更新
- 任务面板展示

### 1.4 学习规划辅助
- 学习计划模板
- 任务拆分（按天/周/月）
- 完成率统计
- 今日任务聚合视图
- 按主题/课程分类

### 1.5 多语言功能
- 支持语言：简体中文、繁體中文、English
- 实时切换，无需重启
- 默认跟随系统语言
- 全界面国际化

### 1.6 自定义背景图片
- 上传本地图片（JPG、PNG、WEBP）
- 背景透明度调节（0-100%）
- 背景模糊度调节（0-50px）
- 显示模式：填充、适应、居中、平铺
- 默认背景图回退
- 文本可读性保护

### 1.7 Windows 桌面应用能力
- 打包为 .exe 安装包
- 系统托盘支持
- 开机启动（可选）
- 最小化到托盘
- 本地数据存储
- 离线优先使用
- 窗口控制（最小化、最大化、关闭）

### 1.8 设置中心
- 通用设置（开机启动、系统托盘）
- 外观设置（主题色、背景图、透明度）
- 语言设置（界面语言切换）
- 编辑器设置（字体、字号、预览模式）
- 任务规则设置（自动识别规则）
- 数据导入导出
- 备份与恢复

---

## 二、用户使用流程

### 2.1 首次启动流程
1. 启动应用 → 语言选择（默认系统语言）
2. 欢迎界面 → 快速教程（可跳过）
3. 进入主界面 → 创建第一个笔记

### 2.2 日常使用流程
1. 打开应用 → 查看今日任务
2. 创建新笔记 → 选择模板（可选）
3. 编辑 Markdown 内容
4. 点击"转换为任务" → 自动生成待办清单
5. 在任务面板管理任务
6. 自动保存 → 关闭应用

### 2.3 学习规划流程
1. 新建笔记 → 选择"学习计划"模板
2. 填写学习目标和内容
3. 使用 Markdown 列表结构化任务
4. 转换为待办 → 设置优先级和截止时间
5. 查看今日任务 → 执行学习计划
6. 查看完成率统计

---

## 三、页面/模块说明

### 3.1 主界面布局
```
┌─────────────────────────────────────────────────────────┐
│  Header (搜索、新建、导入、设置、窗口控制)                │
├──────┬──────────┬─────────────────────┬─────────────────┤
│      │          │                     │                 │
│ 侧边 │ 笔记列表 │   编辑器 + 预览     │   任务面板      │
│ 导航 │          │                     │                 │
│      │          │                     │                 │
└──────┴──────────┴─────────────────────┴─────────────────┘
│                    状态栏                                │
└─────────────────────────────────────────────────────────┘
```

### 3.2 模块说明

#### 侧边导航（Sidebar）
- 新建笔记按钮
- 全部笔记
- 今日任务
- 学习计划
- 收藏
- 归档
- 设置
- 用户信息

#### 笔记列表（NoteList）
- 搜索过滤
- 标签筛选
- 笔记卡片（标题、预览、标签、日期）
- 排序选项

#### 编辑器（Editor）
- Markdown 编辑区
- 实时预览区
- 工具栏（保存、收藏、置顶、模板、转换任务）
- 双栏模式切换

#### 任务面板（TaskPanel）
- 从笔记提取的任务
- 任务完成状态
- 优先级标签
- 截止时间
- 相关目标进度
- 快速添加任务

#### 设置界面（Settings）
- 侧边栏导航（General、Appearance、Language、Editing、Tasks）
- 设置内容区
- 保存/取消按钮

---

## 四、数据结构设计

### 4.1 笔记（Note）
```typescript
interface Note {
  id: string;                    // UUID
  title: string;                 // 标题
  content: string;               // Markdown 内容
  tags: string[];                // 标签数组
  isPinned: boolean;             // 是否置顶
  isFavorite: boolean;           // 是否收藏
  isArchived: boolean;           // 是否归档
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
  category: string;              // 分类（notes/study/work）
}
```

### 4.2 任务（Task）
```typescript
interface Task {
  id: string;                    // UUID
  noteId: string;                // 所属笔记 ID
  title: string;                 // 任务标题
  completed: boolean;            // 完成状态
  priority: 'high' | 'medium' | 'low';  // 优先级
  dueDate?: number;              // 截止时间戳
  level: number;                 // 层级（0-5）
  parentId?: string;             // 父任务 ID
  order: number;                 // 排序序号
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}
```

### 4.3 设置（Settings）
```typescript
interface AppSettings {
  // 通用设置
  general: {
    autoStart: boolean;          // 开机启动
    minimizeToTray: boolean;     // 最小化到托盘
    closeToTray: boolean;        // 关闭到托盘
  };
  
  // 外观设置
  appearance: {
    theme: 'light' | 'dark' | 'auto';  // 主题
    primaryColor: string;        // 主题色
    backgroundImage?: string;    // 背景图路径
    backgroundBlur: number;      // 背景模糊度 (0-50)
    backgroundOpacity: number;   // 背景透明度 (0-100)
    backgroundMode: 'fill' | 'fit' | 'center' | 'tile';  // 背景模式
  };
  
  // 语言设置
  language: 'zh-CN' | 'zh-TW' | 'en';
  
  // 编辑器设置
  editor: {
    fontSize: number;            // 字体大小
    fontFamily: string;          // 字体
    previewMode: 'side' | 'preview' | 'edit';  // 预览模式
    autoSave: boolean;           // 自动保存
    autoSaveInterval: number;    // 自动保存间隔（秒）
  };
  
  // 任务规则设置
  taskRules: {
    autoConvert: boolean;        // 自动转换
    detectCheckbox: boolean;     // 识别复选框
    detectList: boolean;         // 识别列表
    detectHeading: boolean;      // 识别标题
    smartDateDetection: boolean; // 智能日期识别
  };
}
```

### 4.4 模板（Template）
```typescript
interface Template {
  id: string;
  name: string;                  // 模板名称
  nameI18n: Record<string, string>;  // 多语言名称
  content: string;               // Markdown 内容
  category: string;              // 分类
  icon: string;                  // 图标
}
```

---

## 五、Markdown 转待办的解析逻辑

### 5.1 解析规则

#### 规则 1：任务复选框
```markdown
- [ ] 未完成任务  → Task { completed: false, priority: 'medium' }
- [x] 已完成任务  → Task { completed: true, priority: 'medium' }
```

#### 规则 2：优先级识别
```markdown
- [ ] ❗ 高优先级任务  → priority: 'high'
- [ ] ⚠️ 中优先级任务  → priority: 'medium'
- [ ] 普通任务         → priority: 'low'
```

#### 规则 3：日期识别
```markdown
- [ ] 任务 @2024-05-26  → dueDate: timestamp
- [ ] 任务 (截止: 明天)  → dueDate: tomorrow
```

#### 规则 4：层级关系
```markdown
# 标题 1                → level: 0 (父任务组)
## 标题 2              → level: 1 (子任务组)
- [ ] 任务 1           → level: 2
  - [ ] 子任务 1.1     → level: 3, parentId: 任务1.id
```

#### 规则 5：普通列表转任务
```markdown
- 学习 React          → Task { completed: false }
- 学习 TypeScript     → Task { completed: false }
```

### 5.2 解析流程

```typescript
function parseMarkdownToTasks(markdown: string, noteId: string): Task[] {
  const lines = markdown.split('\n');
  const tasks: Task[] = [];
  let currentHeading = '';
  let currentLevel = 0;
  let parentStack: string[] = [];
  
  lines.forEach((line, index) => {
    // 1. 识别标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      currentLevel = headingMatch[1].length - 1;
      currentHeading = headingMatch[2];
      return;
    }
    
    // 2. 识别任务复选框
    const checkboxMatch = line.match(/^(\s*)-\s+\[([ x])\]\s+(.+)$/);
    if (checkboxMatch) {
      const indent = checkboxMatch[1].length;
      const completed = checkboxMatch[2] === 'x';
      const title = checkboxMatch[3];
      
      // 提取优先级和日期
      const { cleanTitle, priority, dueDate } = extractMetadata(title);
      
      const task: Task = {
        id: generateId(),
        noteId,
        title: cleanTitle,
        completed,
        priority,
        dueDate,
        level: currentLevel + Math.floor(indent / 2) + 1,
        order: index,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // 处理父子关系
      if (indent > 0 && tasks.length > 0) {
        task.parentId = findParentTask(tasks, indent);
      }
      
      tasks.push(task);
      return;
    }
    
    // 3. 识别普通列表（可选）
    const listMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (listMatch && settings.taskRules.detectList) {
      // 转换为任务...
    }
  });
  
  return tasks;
}
```

---

## 六、本地存储字段设计

### 6.1 SQLite 数据库结构

#### 表：notes
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,                    -- JSON 数组
  is_pinned INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  category TEXT DEFAULT 'notes',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_category ON notes(category);
```

#### 表：tasks
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  due_date INTEGER,
  level INTEGER DEFAULT 0,
  parent_id TEXT,
  order_num INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_note_id ON tasks(note_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

#### 表：settings
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,          -- JSON 字符串
  updated_at INTEGER NOT NULL
);
```

#### 表：templates
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_i18n TEXT,               -- JSON 对象
  content TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  created_at INTEGER NOT NULL
);
```

### 6.2 文件存储结构
```
C:\Users\[用户名]\AppData\Roaming\MemoPlan\
├── data\
│   └── memoplan.db           # SQLite 数据库
├── backgrounds\              # 背景图片
│   ├── default.jpg
│   └── user_*.jpg
├── backups\                  # 备份文件
│   └── backup_20240526.zip
└── logs\                     # 日志文件
    └── app.log
```

---

## 七、技术架构建议

### 7.1 技术栈
- **前端框架**: React 18 + TypeScript
- **桌面框架**: Tauri 2.0
- **状态管理**: Zustand
- **国际化**: react-i18next
- **Markdown**: marked + highlight.js
- **编辑器**: CodeMirror 6
- **UI 组件**: Tailwind CSS + Headless UI
- **数据库**: SQLite (via Tauri SQL plugin)
- **打包工具**: Tauri CLI

### 7.2 项目结构
```
memoplan/
├── src/                      # React 前端代码
│   ├── components/           # UI 组件
│   │   ├── Sidebar/
│   │   ├── NoteList/
│   │   ├── Editor/
│   │   ├── TaskPanel/
│   │   └── Settings/
│   ├── hooks/                # 自定义 Hooks
│   ├── stores/               # Zustand 状态管理
│   ├── services/             # 业务逻辑层
│   │   ├── noteService.ts
│   │   ├── taskService.ts
│   │   └── markdownParser.ts
│   ├── locales/              # 国际化文件
│   │   ├── zh-CN.json
│   │   ├── zh-TW.json
│   │   └── en.json
│   ├── types/                # TypeScript 类型定义
│   └── utils/                # 工具函数
├── src-tauri/                # Tauri 后端代码
│   ├── src/
│   │   ├── main.rs           # 主进程
│   │   ├── db.rs             # 数据库操作
│   │   ├── tray.rs           # 系统托盘
│   │   └── commands.rs       # Tauri 命令
│   ├── icons/                # 应用图标
│   ├── Cargo.toml
│   └── tauri.conf.json       # Tauri 配置
├── public/                   # 静态资源
└── package.json
```

### 7.3 模块分层

#### UI 层（React Components）
- 负责界面渲染和用户交互
- 使用 Zustand 管理状态
- 调用 Service 层接口

#### 编辑器层（Editor Module）
- Markdown 编辑器封装
- 实时预览
- 语法高亮

#### 任务解析层（Parser Module）
- Markdown 解析引擎
- 任务提取规则引擎
- 日期识别

#### 存储层（Storage Module）
- SQLite 数据库操作
- 文件系统操作
- 数据备份恢复

#### 设置层（Settings Module）
- 配置管理
- 主题切换
- 背景图处理

#### 国际化层（i18n Module）
- 多语言支持
- 实时切换
- 语言包管理

### 7.4 关键技术实现

#### Tauri 配置（tauri.conf.json）
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "MemoPlan",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPDATA/MemoPlan/**"]
      },
      "dialog": {
        "all": true
      },
      "window": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": ["msi", "nsis"],
      "identifier": "com.memoplan.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.ico"
      ],
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "systemTray": {
      "iconPath": "icons/tray-icon.png"
    },
    "windows": [
      {
        "title": "MemoPlan",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 600,
        "decorations": false,
        "transparent": true
      }
    ]
  }
}
```

---

## 八、后续可扩展功能建议

### 8.1 短期扩展（v1.1 - v1.3）
- 云同步功能（支持 WebDAV、OneDrive、Google Drive）
- 笔记加密
- 全局快捷键自定义
- 笔记导出为 PDF
- 番茄钟计时器
- 统计图表（学习时长、完成率趋势）

### 8.2 中期扩展（v2.0 - v2.5）
- 多设备同步
- 协作功能（分享笔记）
- AI 辅助（智能摘要、任务建议）
- 插件系统
- 自定义主题商店
- 语音输入

### 8.3 长期扩展（v3.0+）
- 移动端应用（iOS、Android）
- Web 版本
- 团队协作版
- 知识图谱
- 思维导图集成
- OCR 图片识别

---

## 九、开发优先级建议

### Phase 1: MVP（最小可行产品）
1. 基础笔记 CRUD
2. Markdown 编辑器
3. 任务解析核心功能
4. 本地存储
5. 基础 UI

### Phase 2: 核心功能完善
1. 多语言支持
2. 自定义背景
3. 任务面板
4. 搜索和标签
5. 设置中心

### Phase 3: 桌面应用特性
1. 系统托盘
2. 开机启动
3. 全局快捷键
4. 打包和安装程序
5. 自动更新

### Phase 4: 优化和扩展
1. 性能优化
2. 数据备份恢复
3. 导入导出
4. 模板系统
5. 统计功能

---

## 十、性能和安全考虑

### 10.1 性能优化
- 虚拟滚动（笔记列表）
- 防抖和节流（搜索、自动保存）
- 懒加载（图片、预览）
- 数据库索引优化
- 增量渲染

### 10.2 安全措施
- 本地数据加密（可选）
- XSS 防护（Markdown 渲染）
- 文件路径验证
- 输入验证和清理
- 定期备份

### 10.3 用户体验
- 加载状态提示
- 错误处理和提示
- 操作撤销/重做
- 快捷键支持
- 响应式设计

---

**文档版本**: v1.0  
**最后更新**: 2024-05-26  
**维护者**: MemoPlan Team
