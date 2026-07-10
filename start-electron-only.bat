@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   TAX AUTOMATION SOFTWARE - ELECTRON MODE
echo   Enterprise Tax Management Suite (Desktop App Only)
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
echo ✓ Node.js found
echo.

REM ==================== CHECK DEPENDENCIES ====================
echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies
        pause
        exit /b 1
    )
)
echo ✓ Dependencies ready
echo.

REM ==================== START BACKEND SERVICES ====================
echo [3/4] Starting backend services...

REM Start PDF Extraction Service
echo   • Starting PDF Extraction Service (Port 3001)...
start /B node pdf-extraction-server.js
timeout /t 2 /nobreak >nul

REM Start Email Service
echo   • Starting Email Service (Port 3002)...
start /B node email-service.js
timeout /t 2 /nobreak >nul

echo ✓ Backend services started
echo.

REM ==================== START ELECTRON APP ====================
echo [4/4] Launching Electron Desktop Application...
echo.
echo ============================================================
echo   IMPORTANT: Use the ELECTRON WINDOW that opens
echo   (Not a browser tab - it's a desktop application window)
echo ============================================================
echo.

REM Start Electron in foreground
node_modules\.bin\electron.cmd .

echo.
echo ============================================================
echo   APPLICATION CLOSED
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
