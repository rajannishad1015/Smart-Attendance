@echo off
title SmartAttend AI - Stop All Services
color 0C

echo ================================================================
echo           SmartAttend AI - Stopping All Services
echo ================================================================
echo.
echo Scanning and terminating processes on Port 8000, 3000, 3001...

:: Stop Backend on Port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo  [x] Stopping Backend process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Stop Student App on Port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo  [x] Stopping Student App process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Stop Teacher App on Port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo  [x] Stopping Teacher App process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ================================================================
echo  All SmartAttend AI background services have been stopped.
echo ================================================================
echo.
pause
