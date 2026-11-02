@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo ============================================================
echo   AI MYSTERY ROOM - SAFE FRONTEND + GENERATION UPGRADE
echo ============================================================
echo.

if not exist "client\src" (
  echo ERROR: client\src was not found.
  echo Extract this ZIP into the AI-Mystery-Room-Starter project root,
  echo the folder that contains both client and server.
  pause
  exit /b 1
)
if not exist "server\src" (
  echo ERROR: server\src was not found.
  echo Extract this ZIP into the AI-Mystery-Room-Starter project root.
  pause
  exit /b 1
)
if not exist "_casefile_upgrade\client\src\App.jsx" (
  echo ERROR: Upgrade source folder is missing. Extract the complete ZIP first.
  pause
  exit /b 1
)

set "BACKUP=backup_casefile_upgrade_%RANDOM%_%RANDOM%"
md "%BACKUP%" >nul 2>&1
if errorlevel 1 (
  echo ERROR: Could not create the backup folder.
  pause
  exit /b 1
)

echo Backup folder: %BACKUP%
echo Updating the exact source files...
echo.

call :copyfile "_casefile_upgrade\client\src\App.jsx" "client\src\App.jsx"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\client\src\styles.css" "client\src\styles.css"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\client\src\ClueJourney.jsx" "client\src\ClueJourney.jsx"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\client\src\clue-journey.css" "client\src\clue-journey.css"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\client\src\api.js" "client\src\api.js"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\client\vite.config.js" "client\vite.config.js"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\server\src\services\caseGenerator.js" "server\src\services\caseGenerator.js"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\server\src\routes\cases.js" "server\src\routes\cases.js"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\server\src\models\MysteryCase.js" "server\src\models\MysteryCase.js"
if errorlevel 1 goto failed
call :copyfile "_casefile_upgrade\server\src\middleware\errors.js" "server\src\middleware\errors.js"
if errorlevel 1 goto failed

echo.
echo [SUCCESS] Upgrade installed.
echo [BACKUP] Existing versions saved in: %BACKUP%
echo.
echo Next: run START-CASEFILE.cmd from this project folder.
echo It starts the API and Vite together. Vite is configured for port 5174.
echo.
pause
exit /b 0

:copyfile
if not exist "%~1" (
  echo [FAILED] Missing upgrade file: %~1
  exit /b 1
)
for %%D in ("%~2") do set "DESTDIR=%%~dpD"
if exist "%~2" (
  if not exist "%BACKUP%\%DESTDIR%" md "%BACKUP%\%DESTDIR%" >nul 2>&1
  copy /Y "%~2" "%BACKUP%\%DESTDIR%" >nul
  if errorlevel 1 (
    echo [FAILED] Could not back up: %~2
    exit /b 1
  )
)
copy /Y "%~1" "%~2" >nul
if errorlevel 1 (
  echo [FAILED] Could not install: %~2
  exit /b 1
)
echo [OK] %~2
exit /b 0

:failed
echo.
echo ERROR: Installation stopped. Your original files are in %BACKUP%.
echo Check the message above before trying again.
pause
exit /b 1
