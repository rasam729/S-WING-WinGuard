@echo off
echo Running database schema updates...
cd server
npm run schema-update
cd ..
echo.
echo Schema updates complete!
pause
