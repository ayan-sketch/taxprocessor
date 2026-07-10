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
    echo This includes Electron, Vite, React, and all other dependencies...
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

echo All dependencies are ready

:dependencies_ready
echo.

REM ==================== BUILD APPLICATION ====================
echo [3/4] Building application for Electron...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build application
    pause
    exit /b 1
)
echo Build completed successfully
echo.

REM ==================== START APPLICATION ====================
echo [4/4] Starting Electron Desktop Application...
echo.

REM Start PDF Extraction Service in background
echo Starting PDF Extraction Service (Port 3001)...
start "PDF Extraction Service" /MIN cmd /c "node pdf-extraction-server.js"
timeout /t 2 /nobreak >nul

REM Start Email Service in background
echo Starting Email Service (Port 3002)...
start "Email Service" /MIN cmd /c "node email-service.js"
timeout /t 2 /nobreak >nul

echo.
echo ============================================================
echo   TAX AUTOMATION SOFTWARE - ELECTRON APP STARTED
echo ============================================================
echo.
echo   Desktop App:   Running as Electron Application
echo   PDF Service:   http://localhost:3001
echo   Email Service: http://localhost:3002
echo.
echo   The desktop application window will open automatically.
echo   Press Ctrl+C to stop all services when you're done.
echo.
echo ============================================================
echo.

REM Start Electron application
echo Starting Electron Desktop Application...
echo.
call npm run electron

REM If the app stops for any reason, cleanup background services
echo.
echo Application closed. Cleaning up background services...
taskkill /f /im node.exe /fi "WINDOWTITLE eq PDF Extraction Service*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq Email Service*" >nul 2>&1
echo Cleanup completed.
echo.
pause