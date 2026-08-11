@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PORT=4283"

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" "http://127.0.0.1:%PORT%/index.html"
    py -m http.server %PORT% --bind 127.0.0.1
    exit /b
)

set "BUNDLED_PY=C:\Users\maxvs\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%BUNDLED_PY%" (
    start "" "http://127.0.0.1:%PORT%/index.html"
    "%BUNDLED_PY%" -m http.server %PORT% --bind 127.0.0.1
    exit /b
)

echo 找不到 Python，請改用 start-admin.bat（同時可預覽 index.html），或安裝 VS Code 的 Live Server 擴充功能。
pause
