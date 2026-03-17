@echo off
chcp 65001 >nul
echo ==========================================
echo MemoPlan 桌面应用打包脚本
echo ==========================================
echo.

:: 检查是否安装了 Node.js
echo [1/5] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo Node.js 版本: 
node --version
echo.

:: 检查是否安装了 pnpm
echo [2/5] 检查 pnpm 环境...
where pnpm >nul 2>&1
if errorlevel 1 (
    echo 正在安装 pnpm...
    npm install -g pnpm
)
echo pnpm 版本:
pnpm --version
echo.

:: 安装依赖
echo [3/5] 安装项目依赖...
call pnpm install
if errorlevel 1 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)
echo 依赖安装完成！
echo.

:: 构建前端应用
echo [4/5] 构建前端应用...
call pnpm run build
if errorlevel 1 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)
echo 前端构建完成！
echo.

:: 打包 Electron 应用
echo [5/5] 打包 Electron 应用...
call pnpm exec electron-builder --win
if errorlevel 1 (
    echo 错误: Electron 打包失败
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 打包完成！
echo ==========================================
echo.
echo 安装包位置: release\MemoPlan Setup 1.0.0.exe
echo 便携版位置: release\MemoPlan 1.0.0.exe
echo.
pause
