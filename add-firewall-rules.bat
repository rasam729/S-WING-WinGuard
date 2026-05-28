@echo off
echo ========================================
echo WinGuard - Add Firewall Rules
echo ========================================
echo.
echo This script will add Windows Firewall rules to allow:
echo - Port 3000 (Backend Server)
echo - Port 5173 (Citizen App)
echo - Port 5174 (Dashboard)
echo.
echo Please run this script as Administrator!
echo.
pause

echo.
echo Adding firewall rule for Backend Server (Port 3000)...
netsh advfirewall firewall add rule name="WinGuard Backend Server 3000" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% equ 0 (
    echo ✓ Backend Server rule added successfully
) else (
    echo ✗ Failed to add Backend Server rule - Make sure you're running as Administrator
)

echo.
echo Adding firewall rule for Citizen App (Port 5173)...
netsh advfirewall firewall add rule name="WinGuard Citizen App 5173" dir=in action=allow protocol=TCP localport=5173
if %errorlevel% equ 0 (
    echo ✓ Citizen App rule added successfully
) else (
    echo ✗ Failed to add Citizen App rule - Make sure you're running as Administrator
)

echo.
echo Adding firewall rule for Dashboard (Port 5174)...
netsh advfirewall firewall add rule name="WinGuard Dashboard 5174" dir=in action=allow protocol=TCP localport=5174
if %errorlevel% equ 0 (
    echo ✓ Dashboard rule added successfully
) else (
    echo ✗ Failed to add Dashboard rule - Make sure you're running as Administrator
)

echo.
echo ========================================
echo Firewall rules configuration complete!
echo ========================================
echo.
echo You can now access the apps from your mobile device:
echo.
echo Citizen App: http://172.17.9.253:5173/
echo Alternative:  http://172.26.80.1:5173/
echo.
echo Make sure both devices are on the same WiFi network!
echo.
pause
