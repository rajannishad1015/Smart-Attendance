@echo off
setlocal enabledelayedexpansion
title SmartAttend AI - Universal 1-Click Launcher
color 0B

echo ================================================================
echo           SmartAttend AI - Universal 1-Click Launcher
echo ================================================================
echo.
echo [1/4] Checking environment prerequisites...

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python was not found in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    echo and make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
echo  [OK] Python detected.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found in PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js detected.

:: Check / initialize authentic database
if not exist "%~dp0smartattend.db" (
    echo  [INFO] Initializing clean database with authentic accounts...
    python -m backend.app.seed_data
)

:: Check student-app dependencies
if not exist "%~dp0frontend\student-app\node_modules" (
    echo  [INFO] Installing dependencies for Student App...
    cd /d "%~dp0frontend\student-app"
    call npm install
    cd /d "%~dp0"
)

:: Check teacher-app dependencies
if not exist "%~dp0frontend\teacher-app\node_modules" (
    echo  [INFO] Installing dependencies for Teacher App...
    cd /d "%~dp0frontend\teacher-app"
    call npm install
    cd /d "%~dp0"
)

echo.
echo ================================================================
echo [2/4] Starting FastAPI Backend on Port 8000...
start "SmartAttend - Backend (Port 8000)" cmd /k "cd /d "%~dp0" && title SmartAttend - Backend (Port 8000) && color 0A && echo ======================================== && echo   FastAPI Backend Server (Port 8000) && echo ======================================== && echo. && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/4] Starting Student Web App on Port 3000...
timeout /t 3 /nobreak >nul
start "SmartAttend - Student Portal (Port 3000)" cmd /k "cd /d "%~dp0frontend\student-app" && title SmartAttend - Student Portal (Port 3000) && color 09 && echo ======================================== && echo   Student Web App (Port 3000) && echo ======================================== && echo. && npm run dev"

echo [4/4] Starting Teacher Web App on Port 3001...
timeout /t 2 /nobreak >nul
start "SmartAttend - Teacher Portal (Port 3001)" cmd /k "cd /d "%~dp0frontend\teacher-app" && title SmartAttend - Teacher Portal (Port 3001) && color 0D && echo ======================================== && echo   Teacher Web App (Port 3001) && echo ======================================== && echo. && npm run dev"

echo.
echo Waiting for web servers to initialize...
timeout /t 4 /nobreak >nul

:: Open browser windows
echo Opening portals in your default browser...
start http://localhost:3000
start http://localhost:3001

cls
color 0A
echo ================================================================
echo        SmartAttend AI - All Services Running Successfully!
echo ================================================================
echo.
echo  [1] Student Portal   : http://localhost:3000
echo      - Login Roll No. : S101  (or rahul@smartattend.edu)
echo      - Password       : password123
echo      - User           : Rahul Sharma
echo.
echo  [2] Teacher Portal   : http://localhost:3001
echo      - Login Email    : teacher@smartattend.edu
echo      - Password       : password123
echo      - Faculty        : Prof. Aniket Deshmukh
echo.
echo  [3] Backend API Docs : http://127.0.0.1:8000/docs
echo.
echo ================================================================
echo  MANAGEMENT NOTES:
echo   * Keep the 3 background terminal windows open while using the app.
echo   * To cleanly STOP all services anytime, double-click "stop_all.bat".
echo ================================================================
echo.
echo Press any key to close this launcher summary window...
pause >nul
