@echo off
setlocal
cd /d "%~dp0"
echo.
echo =============================================
echo       AI MYSTERY ROOM - FIRST TIME SETUP
echo =============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Install Node.js 20+ from https://nodejs.org/ and reopen CMD.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Reinstall Node.js and reopen CMD.
  pause
  exit /b 1
)
node -v
echo.
if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo Created server\.env from the example.
)
echo Installing root tools...
npm install
if errorlevel 1 goto failed
echo Installing backend packages...
npm install --prefix server
if errorlevel 1 goto failed
echo Installing frontend packages...
npm install --prefix client
if errorlevel 1 goto failed
echo.
echo SETUP COMPLETE!
echo Next: edit server\.env and add GEMINI_API_KEY. Then double-click START.bat or run START.bat in CMD.
echo.
start notepad "server\.env"
pause
exit /b 0
:failed
echo.
echo INSTALLATION FAILED. Check your internet connection and Node.js version, then run SETUP.bat again.
pause
exit /b 1
