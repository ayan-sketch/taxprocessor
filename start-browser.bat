@echo off
color 0C
cls
echo.
echo ============================================================
echo   WARNING: WRONG STARTUP SCRIPT
echo ============================================================
echo.
echo   You are trying to run start.bat
echo   This opens the app in a BROWSER (limited features)
echo.
echo   For FULL FEATURES including "Add Return" button:
echo   Please use: start-electron.bat
echo.
echo ============================================================
echo.
echo   Press any key to continue with BROWSER mode (limited)
echo   Or close this window and run start-electron.bat instead
echo.
pause
color 07
cls
echo ============================================================
echo   TAX AUTOMATION SOFTWARE - BROWSER MODE
echo   (Limited Features - No Electron APIs)
echo ============================================================
echo.
echo   NOTE: "Add Return" button will be DISABLED in browser mode
echo   Use start-electron.bat for full desktop features
echo.
echo Starting application in browser mode...
echo.

REM ==================== CHECK NODE.JS ====================
echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo Node.js found
echo.

REM ==================== INSTALL/UPDATE NPM DEPENDENCIES ====================
echo [2/3] Checking dependencies with hot-reload support...

if not exist "node_modules" (
    echo Installing all dependencies for the first time...
    echo This includes Vite hot-reload and React Fast Refresh...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies
        pause
        exit /b 1
    )
    echo All dependencies installed successfully
    goto dependencies_ready
)

echo Dependencies folder exists
if not exist "node_modules\vite" (
    echo Vite not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    goto dependencies_ready
)

echo Hot-reload dependencies are ready

:dependencies_ready
echo.

REM ==================== START APPLICATION ====================
echo [3/3] Starting Tax Automation Software in BROWSER MODE...
echo.

REM Start PDF Extraction Service in background (same window)
echo Starting PDF Extraction Service (Port 3001)...
start /B node pdf-extraction-server.js
timeout /t 2 /nobreak >nul

REM Start Email Service in background (same window)
echo Starting Email Service (Port 3002)...
start /B node email-service.js
timeout /t 2 /nobreak >nul

echo Backend services started in background.
echo.

REM Start Vite Dev Server in background (same window)
echo Starting Vite Dev Server (Port 5173)...
start /B npm run dev
timeout /t 8 /nobreak >nul

echo.
echo ============================================================
echo   TAX AUTOMATION SOFTWARE IS RUNNING IN BROWSER
echo ============================================================
echo.
echo   Vite Dev Server: http://localhost:5173
echo   PDF Service:     http://localhost:3001
echo   Email Service:   http://localhost:3002
echo.
echo   REMINDER: You are in BROWSER MODE
echo   "Add Return" and file operations will NOT work
echo   Use start-electron.bat for full desktop features
echo.
echo   Press Ctrl+C to stop all services.
echo.
pause
