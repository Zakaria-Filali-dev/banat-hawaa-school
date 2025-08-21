@echo off
echo 🛑 Stopping Development Servers
echo ===============================

echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo ✅ All development servers stopped!
echo You can now run start-dev.bat to restart.
