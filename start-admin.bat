@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PORT=4284"

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" "http://127.0.0.1:%PORT%/admin.html"
    node admin-server.js
    exit /b
)

set "BUNDLED_NODE=C:\Users\maxvs\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
    start "" "http://127.0.0.1:%PORT%/admin.html"
    "%BUNDLED_NODE%" admin-server.js
    exit /b
)

echo 找不到 Node.js，請先安裝 Node.js（https://nodejs.org）再執行本檔案。
pause
