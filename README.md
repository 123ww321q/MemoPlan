# MemoPlan

桌面便签 + Markdown 笔记 + 学习待办规划工具

## 功能特性

- 📝 Markdown 编辑器（实时预览）
- ✅ 智能任务提取（从 Markdown 自动生成待办）
- 🌍 多语言支持（简体中文、繁體中文、English）
- 🎨 自定义背景图片
- 📊 学习计划管理
- 🔖 标签分类
- 🔍 全局搜索
- 💾 本地存储

## 技术栈

- Tauri 1.5
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- react-i18next

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建 Windows 安装包
npm run tauri:build
```

## 打包

运行 `npm run tauri:build` 会在 `src-tauri/target/release/bundle/` 目录生成：
- `.msi` 安装包
- `.exe` 安装程序（NSIS）

## 许可证

MIT
