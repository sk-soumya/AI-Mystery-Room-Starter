@echo off
setlocal
cd /d "%~dp0"
if not exist "client\node_modules" (
  echo Please run SETUP.bat first.
  pause
  exit /b 1
)
if not exist "server\node_modules" (
  echo Please run SETUP.bat first.
  pause
  exit /b 1
)
echo Starting AI Mystery Room...
start "AI Mystery Room API" cmd /k "cd /d "%~dp0server" && npm run dev"
start "AI Mystery Room Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 4 /nobreak >nul
start "" http://localhost:5173
echo.
echo Keep both terminal windows open while using the app.
