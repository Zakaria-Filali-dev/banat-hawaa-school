@echo off
echo 🚀 Starting Development Server
echo ==============================

echo 🛑 Stopping any existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo ⏳ Waiting for processes to terminate...
timeout /t 2 /nobreak >nul

echo 🚀 Starting development server...
echo Frontend: http://localhost:5174/
echo Backend:  http://localhost:3000/
echo.

npm run dev
