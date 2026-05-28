@echo off
echo ========================================
echo    WinGuard - Starting All Services
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Starting Backend API Server...
start "WinGuard API" cmd /k "cd server && npm run dev"
timeout /t 3 >nul

echo [2/3] Starting Official Dashboard (Web)...
start "WinGuard Dashboard" cmd /k "cd apps\official-dashboard && npm run dev"
timeout /t 3 >nul

echo [3/3] Starting Citizen App (Web)...
start "WinGuard Citizen App" cmd /k "cd apps\citizen-app && npm run dev"
timeout /t 3 >nul

echo.
echo ========================================
echo    All Services Started!
echo ========================================
echo.
echo Backend API:        http://localhost:3000
echo Official Dashboard: http://localhost:5173
echo Citizen App:        http://localhost:5174
echo.
echo Press any key to open the dashboard in your browser...
pause >nul

start http://localhost:5173

echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
