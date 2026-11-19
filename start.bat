@echo off
rem Double-click this file on Windows to start Innkeep.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Innkeep needs Node.js, which is not installed on this computer.
  echo   A page is opening: download the version marked LTS, install it, then double-click this file again.
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)
node scripts\start.mjs
echo.
echo   Innkeep has stopped.
pause
