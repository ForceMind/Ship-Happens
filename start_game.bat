@echo off
title Ship Happens - Server

echo ==============================================
echo             Ship Happens
echo ==============================================
echo.
echo Checking and starting local game server...
echo.

if not exist node_modules (
    echo [INFO] First time run detected, installing dependencies...
    call npm install
)

echo [INFO] Starting Vite development server...
echo [INFO] The game will start soon. Please open http://localhost:5173 in your browser.
echo.

call npm run dev -- --open --host
pause
