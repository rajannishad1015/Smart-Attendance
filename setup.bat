@echo off
setlocal enabledelayedexpansion
title SmartAttend AI - Environment & Dependency Setup
color 0B

echo ================================================================
echo           SmartAttend AI - 1-Click Environment Setup
echo ================================================================
echo.
echo This script will verify your system prerequisites, install all
echo Python and Node.js dependencies, initialize the database, and
echo verify traditional Machine Learning models.
echo.

:: ----------------------------------------------------------------
:: [1/5] Check Prerequisites
:: ----------------------------------------------------------------
echo [1/5] Checking environment prerequisites...

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Python was not found in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    echo Ensure you check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo  [OK] %PYTHON_VER% detected.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Node.js was not found in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v 2^>^&1') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% detected.

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] npm was not found in PATH!
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v 2^>^&1') do set NPM_VER=%%i
echo  [OK] npm v%NPM_VER% detected.

echo.
:: ----------------------------------------------------------------
:: [2/5] Python Backend Dependencies
:: ----------------------------------------------------------------
echo [2/5] Installing Python Backend dependencies from backend\requirements.txt...
pip install -r "%~dp0backend\requirements.txt"
if %errorlevel% neq 0 (
    color 0E
    echo  [WARNING] pip install returned a warning/non-zero status. Proceeding...
) else (
    echo  [OK] Python dependencies installed successfully.
)

echo.
:: ----------------------------------------------------------------
:: [3/5] Frontend Dependencies (Student & Teacher Apps)
:: ----------------------------------------------------------------
echo [3/5] Installing Frontend Dependencies...

echo  - Installing Student Web App packages...
cd /d "%~dp0frontend\student-app"
call npm install
if %errorlevel% neq 0 (
    echo  [WARNING] npm install in student-app encountered issues.
) else (
    echo  [OK] Student Web App dependencies ready.
)

echo  - Installing Teacher Web App packages...
cd /d "%~dp0frontend\teacher-app"
call npm install
if %errorlevel% neq 0 (
    echo  [WARNING] npm install in teacher-app encountered issues.
) else (
    echo  [OK] Teacher Web App dependencies ready.
)

cd /d "%~dp0"

echo.
:: ----------------------------------------------------------------
:: [4/5] Database Initialization
:: ----------------------------------------------------------------
echo [4/5] Initializing / verifying SQLite Database...
if not exist "%~dp0smartattend.db" (
    echo  - Seeding authentic student & teacher accounts...
    python -m backend.app.seed_data
    echo  [OK] Database seeded successfully.
) else (
    echo  [OK] Database smartattend.db already present.
)

echo.
:: ----------------------------------------------------------------
:: [5/5] Verify Traditional ML Models
:: ----------------------------------------------------------------
echo [5/5] Verifying Traditional Machine Learning Models...
if not exist "%~dp0ml\models\attendance_risk_model.joblib" (
    echo  - Training traditional Scikit-Learn / XGBoost models...
    python ml\train_all.py
    echo  [OK] ML models generated in ml\models\
) else (
    echo  [OK] Pre-trained models verified in ml\models\
)

echo.
cls
color 0A
echo ================================================================
echo           SmartAttend AI - Setup Completed Successfully!
echo ================================================================
echo.
echo All prerequisites, packages, database, and ML assets are ready.
echo.
echo NEXT STEPS:
echo  1. To launch all services (Backend + Student + Teacher):
echo     Run: start.bat   (or double-click run_all.bat)
echo.
echo  2. To stop all running services:
echo     Run: stop_all.bat
echo.
echo  3. Portals will be available at:
echo     - Student Web Portal : http://localhost:3000
echo     - Teacher Web Portal : http://localhost:3001
echo     - Backend Swagger API: http://127.0.0.1:8000/docs
echo.
echo ================================================================
echo Press any key to exit this setup window...
pause >nul
