@echo off
chcp 65001 >nul
echo ========================================================
echo       RedCard Studio - 一键创建桌面快捷方式
echo ========================================================
echo.

cd /d "%~dp0..\.." || exit /b 1

if not exist "RedCard_Studio.exe" (
    echo [错误] 未在当前目录下找到 RedCard_Studio.exe！
    pause
    exit /b
)

cscript //nologo "%~dp0create_shortcut.vbs"

if exist "%USERPROFILE%\Desktop\RedCard Studio.lnk" (
    echo.
    echo [成功] 桌面快捷方式已成功创建！
    echo 快捷方式位置: %USERPROFILE%\Desktop\RedCard Studio.lnk
    echo 以后您可直接在 Windows 桌面上双击 "RedCard Studio" 图标启动！
) else (
    echo.
    echo [提示] 快捷方式未能自动写入，您可以直接在当前目录双击 RedCard_Studio.exe 运行。
)

echo.
pause
