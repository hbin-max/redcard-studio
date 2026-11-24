@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

git rev-parse --verify HEAD >nul 2>&1
if errorlevel 1 (
    echo [错误] 请先在项目仓库中创建提交。
    goto :failed
)

set "REDCARD_BRANCH="
for /f "delims=" %%B in ('git branch --show-current') do set "REDCARD_BRANCH=%%B"
if not "%REDCARD_BRANCH%"=="master" if not "%REDCARD_BRANCH%"=="main" (
    echo [错误] 请切换到 master 或 main 后再运行此脚本。
    goto :failed
)

git remote get-url origin >nul 2>&1
if not errorlevel 1 goto :push

set "REDCARD_REPO_URL="
set /p "REDCARD_REPO_URL=请输入 GitHub 仓库 HTTPS 地址: "
powershell.exe -NoProfile -Command "$url = $env:REDCARD_REPO_URL; if ($url -notmatch '^https://github\.com/[a-zA-Z0-9-]+/[a-zA-Z0-9_.-]+/?$') { exit 2 }; & git remote add origin $url; exit $LASTEXITCODE"
if errorlevel 1 (
    echo [错误] 无法添加 origin，请检查 GitHub 仓库地址。
    goto :failed
)

:push
echo 正在推送当前分支的已提交内容到 origin...
git push -u origin HEAD
if errorlevel 1 goto :failed

echo [成功] 已推送。请在 GitHub 仓库的 Actions 页面查看打包状态。
pause
exit /b 0

:failed
pause
exit /b 1
