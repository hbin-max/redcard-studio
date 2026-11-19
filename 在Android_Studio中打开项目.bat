@echo off
chcp 65001 >nul
echo ========================================================
echo       RedCard Studio - 正在打开 Android Studio 安卓工程
echo ========================================================
echo.

cd /d "%~dp0"
set ANDROID_DIR=%~dp0android

echo 1. 正在同步最新前端页面代码到 Android 资源目录...
call npm run build
call npx cap sync android

echo.
echo 2. 正在启动 Android Studio...
if exist "E:\AndroidStudio\bin\studio64.exe" (
    start "" "E:\AndroidStudio\bin\studio64.exe" "%ANDROID_DIR%"
) else (
    start "" "E:\use\新建文件夹 (6)\bin\studio64.exe" "%ANDROID_DIR%"
)

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
