@echo off
setlocal
cd /d "%~dp0"
echo.
echo ============================================================
echo   AI MYSTERY ROOM - LOCAL DEVELOPMENT SERVER
echo ============================================================
echo Frontend: http://localhost:5174
echo Backend:  http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop both services.
echo.
call npm run dev
pause
