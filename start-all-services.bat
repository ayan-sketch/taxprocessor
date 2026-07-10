@echo off
echo ========================================
echo Tax Automation Software - Quick Start
echo ========================================
echo.

echo Starting services...
echo.

REM Start PDF Extraction Service
echo [1/3] Starting PDF Extraction Service (Port 3001)...
start "PDF Extraction Service" cmd /k "node pdf-extraction-server.js"
timeout /t 2 /nobreak >nul

REM Start Email Service
echo [2/3] Starting Email Service (Port 3002)...
start "Email Service" cmd /k "node email-service.js"
timeout /t 2 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend Development Server (Port 5173)...
start "Frontend Dev Server" cmd /k "npm run dev -- --open=false"

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Services running:
echo   - PDF Extraction: http://localhost:3001
echo   - Email Service:  http://localhost:3002
echo   - Frontend:       http://localhost:5173
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /FI "WindowTitle eq PDF Extraction Service*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Email Service*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Dev Server*" /T /F >nul 2>&1
echo All services stopped.
pause
