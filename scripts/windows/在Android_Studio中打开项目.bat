@echo off
chcp 65001 >nul
echo ========================================================
echo       RedCard Studio - 正在打开 Android Studio 安卓工程
echo ========================================================
echo.

cd /d "%~dp0..\.." || exit /b 1
echo 1. 正在同步最新前端页面代码到 Android 资源目录...
call npm run mobile:sync
if errorlevel 1 goto :failed

echo.
echo 2. 正在启动 Android Studio...
node scripts\open-android-studio.cjs
if errorlevel 1 goto :failed

echo.
echo [成功] Android Studio 已启动并载入安卓工程！
echo.
echo ========================================================
echo 导出 APK 步骤（只需点一下）：
echo   1. 等待 Android Studio 底部 Gradle 自动同步完成；
echo   2. 点击顶部菜单栏：【Build】 -^> 【Build Bundle(s) / APK(s)】 -^> 【Build APK(s)】；
echo   3. 编译完成后，点击右下角气泡里的【locate】链接即可获取 app-debug.apk！
echo ========================================================
echo.
pause
exit /b 0

:failed
echo [错误] Android 资源同步或项目打开失败，请检查上方输出。
pause
exit /b 1
