@echo off
chcp 65001 >nul
title 小红书干货/测评图文生成器 - RedCard Studio
echo ========================================================
echo   📕 正在启动 RedCard Studio 小红书图文生成工作台...
echo   本地服务地址: http://localhost:5173
echo ========================================================
cd /d "%~dp0..\.." || exit /b 1
call npm run dev -- --open
pause
