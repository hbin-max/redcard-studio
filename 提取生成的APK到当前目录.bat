@echo off
chcp 65001 >nul
echo ========================================================
echo       RedCard Studio - 提取编译完成的 Android APK
echo ========================================================
echo.

cd /d "%~dp0"
set SOURCE_APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk
set TARGET_APK=%~dp0RedCard_Studio.apk

if exist "%SOURCE_APK%" (
    copy /y "%SOURCE_APK%" "%TARGET_APK%" >nul
    if errorlevel 1 goto :failed
    echo [成功] 已成功提取 APK 安装包！
    echo APK 文件已放置在: %TARGET_APK%
    echo 正在为您打开所在文件夹...
    explorer /select,"%TARGET_APK%"
) else (
    echo [提示] 尚未检测到编译完成的 APK 文件。
    echo 请确认您已在 Android Studio 中点击：
    echo 【Build】 -^> 【Build Bundle(s) / APK(s)】 -^> 【Build APK(s)】
    echo 编译完成后再次运行本脚本即可！
)

echo.
pause
exit /b 0

:failed
echo [错误] 复制 APK 失败，请检查目标路径和文件占用情况。
pause
exit /b 1
