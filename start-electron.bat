@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   TAX AUTOMATION SOFTWARE - ELECTRON DESKTOP APP
echo   Enterprise Tax Management Suite
echo   © 2026 Tax Practice Management System
echo ============================================================
echo.
echo Starting Electron Desktop Application...
echo.

REM ==================== CHECK NODE.JS ====================
echo [1/4] Checking Node.js installation...
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
echo [2/4] Checking dependencies...

if not exist "node_modules" (
    echo Installing all dependencies for the first time...
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
if not exist "node_modules\electron" (
    echo Electron not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    goto dependencies_ready
)

echo Dependencies are ready

:dependencies_ready
echo.

REM ==================== START BACKEND SERVICES ====================
echo [3/4] Starting backend services...
echo.

REM Start PDF Extraction Service in background
echo Starting PDF Extraction Service (Port 3001)...
start /B node pdf-extraction-server.js
timeout /t 2 /nobreak >nul

REM Start Email Service in background
echo Starting Email Service (Port 3002)...
start /B node email-service.js
timeout /t 2 /nobreak >nul

echo Backend services started.
echo.

REM ==================== START VITE DEV SERVER ====================
echo [4/4] Starting Vite Dev Server...
echo.

REM Start Vite Dev Server in background
echo Starting Vite Dev Server (Port 5173)...
start /B npm run dev

REM Wait for Vite to be ready
echo Waiting for Vite dev server to be ready...
timeout /t 10 /nobreak >nul

REM ==================== START ELECTRON APP ====================
echo.
echo Starting Electron Desktop Application...
echo.

REM Set environment variable for development mode
set NODE_ENV=development

REM Start Electron (this will open the desktop window)
node_modules\.bin\electron.cmd .

REM When Electron closes, this script continues
echo.
echo ============================================================
echo   ELECTRON APP CLOSED
echo ============================================================
echo.
echo Stopping background services...
echo Press Ctrl+C to stop all services or close this window.
echo.
pause
