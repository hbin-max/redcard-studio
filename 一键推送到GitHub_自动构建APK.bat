@echo off
chcp 65001 >nul
echo ========================================================
echo       RedCard Studio - 一键推送到 GitHub 触发云端自动构建
echo ========================================================
echo.

cd /d "%~dp0"

echo 正在检查 Git 仓库状态...
git status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 正在初始化本地 Git 仓库...
    git init
    git add .
    git commit -m "feat: initial commit for cloud build"
)

echo.
echo ========================================================
echo 请按以下步骤操作（只需 30 秒）：
echo   1. 打开浏览器登录 GitHub: https://github.com/new
echo   2. 创建一个新的空白仓库（例如名称填: xiaohongshu-card-studio）
echo   3. 复制仓库的 HTTPS 地址（例如: https://github.com/your-name/xiaohongshu-card-studio.git）
echo ========================================================
echo.

set /p REPO_URL="请输入您的 GitHub 仓库 HTTPS 地址并按回车: "

if "%REPO_URL%"=="" (
    echo.
    echo [错误] 仓库地址不能为空！
    pause
    exit /b
)

echo.
echo 正在关联远程仓库: %REPO_URL% ...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo 正在推送到 GitHub 并触发自动化云端构建...
git branch -M main
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo [成功] 代码已成功推送到 GitHub！
    echo.
    echo 正在打开您的 GitHub 仓库 Actions 构建页面...
    echo 您可以在网页中看到 GitHub 正在自动为您编译:
    echo   - Android APK 安装包
    echo   - Windows 独立 EXE
    echo   - macOS DMG 镜像
    echo 编译完成后直接在页面下方点击下载即可！
    echo ========================================================
    echo.
) else (
    echo.
    echo [提示] 推送遇到问题，请检查网络或确认已在浏览器弹窗中登录 GitHub 授权。
)

pause
