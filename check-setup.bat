@echo off
echo ========================================
echo    WinGuard Setup Checker
echo ========================================
echo.

set "ERRORS=0"

REM Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo     ✓ Node.js installed: %NODE_VERSION%
) else (
    echo     ✗ Node.js NOT installed
    echo       Download from: https://nodejs.org/
    set /a ERRORS+=1
)
echo.

REM Check npm
echo [2/5] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo     ✓ npm installed: %NPM_VERSION%
) else (
    echo     ✗ npm NOT installed
    set /a ERRORS+=1
)
echo.

REM Check PostgreSQL
echo [3/5] Checking PostgreSQL...
where psql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     ✓ PostgreSQL installed
) else (
    echo     ⚠ PostgreSQL NOT found in PATH
    echo       Make sure PostgreSQL is installed and running
)
echo.

REM Check server folder
echo [4/5] Checking server folder...
if exist "server\package.json" (
    echo     ✓ Server folder exists
    if exist "server\node_modules" (
        echo     ✓ Server dependencies installed
    ) else (
        echo     ⚠ Server dependencies NOT installed
        echo       Run: cd server ^&^& npm install
    )
) else (
    echo     ✗ Server folder NOT found
    set /a ERRORS+=1
)
echo.

REM Check apps folders
echo [5/5] Checking app folders...
if exist "apps\official-dashboard\package.json" (
    echo     ✓ Official Dashboard folder exists
    if exist "apps\official-dashboard\node_modules" (
        echo     ✓ Dashboard dependencies installed
    ) else (
        echo     ⚠ Dashboard dependencies NOT installed
        echo       Run: cd apps\official-dashboard ^&^& npm install
    )
) else (
    echo     ✗ Official Dashboard folder NOT found
    set /a ERRORS+=1
)

if exist "apps\citizen-app\package.json" (
    echo     ✓ Citizen App folder exists
    if exist "apps\citizen-app\node_modules" (
        echo     ✓ Citizen App dependencies installed
    ) else (
        echo     ⚠ Citizen App dependencies NOT installed
        echo       Run: cd apps\citizen-app ^&^& npm install
    )
) else (
    echo     ✗ Citizen App folder NOT found
    set /a ERRORS+=1
)
echo.

echo ========================================
if %ERRORS% EQU 0 (
    echo    ✓ Setup looks good!
    echo.
    echo    You can now run: start-all.bat
) else (
    echo    ✗ Found %ERRORS% critical error(s)
    echo.
    echo    Please fix the errors above before running.
)
echo ========================================
echo.
pause
