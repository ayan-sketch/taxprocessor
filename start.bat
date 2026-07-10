@echo off
color 07
cls
echo ============================================================
echo   TAX AUTOMATION SOFTWARE - WEB MODE
echo ============================================================
echo.
echo Starting application in browser mode with hot-reload...
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
)

echo Hot-reload dependencies are ready

:dependencies_ready
echo.


REM ==================== START APPLICATION ====================
echo [3/3] Starting Tax Automation Software in WEB MODE...
echo.

REM Start PDF Extraction Service in background
echo Starting PDF Extraction Service (Port 3001)...
start /B node pdf-extraction-server.js
timeout /t 2 /nobreak >nul

REM Start Email Service in background
echo Starting Email Service (Port 3002)...
start /B node email-service.js
timeout /t 2 /nobreak >nul

echo Backend services started in background.
echo.

REM Start Vite Dev Server with hot-reload
echo Starting Vite Dev Server with Hot-Reload (Port 5173)...
start /B npm run dev
echo Waiting for Vite to be ready...
timeout /t 8 /nobreak >nul

REM Open browser automatically
echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ============================================================
echo   TAX AUTOMATION SOFTWARE IS RUNNING
echo ============================================================
echo.
echo   Web Application: http://localhost:5173
echo   PDF Service:     http://localhost:3001
echo   Email Service:   http://localhost:3002
echo.
echo   HOT-RELOAD ENABLED:
echo   - Edit any file in src/ folder
echo   - Changes will automatically appear in the browser
echo   - No need to refresh manually
echo.
echo   Press Ctrl+C to stop all services.
echo.
pause
