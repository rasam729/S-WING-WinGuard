@echo off
echo ========================================
echo WinGuard - Installing Enhanced Features Dependencies
echo ========================================
echo.

echo Installing Dashboard Dependencies...
cd apps\official-dashboard
call npm install recharts date-fns
if %errorlevel% equ 0 (
    echo ✓ Dashboard dependencies installed successfully
) else (
    echo ✗ Failed to install dashboard dependencies
)

echo.
echo Installing Citizen App Dependencies...
cd ..\citizen-app
call npm install react-dropzone react-image-crop react-hook-form zod @hookform/resolvers react-hot-toast date-fns
if %errorlevel% equ 0 (
    echo ✓ Citizen App dependencies installed successfully
) else (
    echo ✗ Failed to install citizen app dependencies
)

cd ..\..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Review COMPREHENSIVE_FEATURES_GUIDE.md
echo 2. Review IMPLEMENTATION_SUMMARY.md
echo 3. Start implementing the features
echo.
pause
