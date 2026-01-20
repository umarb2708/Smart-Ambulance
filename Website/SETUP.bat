@echo off
echo ================================================
echo Smart Ambulance System - XAMPP Setup Script
echo ================================================
echo.

REM Check if XAMPP is installed
if not exist "C:\xampp\xampp-control.exe" (
    echo [ERROR] XAMPP not found at C:\xampp\
    echo Please install XAMPP first from: https://www.apachefriends.org/
    pause
    exit /b 1
)

echo [1/5] Checking XAMPP installation... OK
echo.

REM Copy files to htdocs
echo [2/5] Copying files to XAMPP htdocs...
set "SOURCE=%~dp0"
set "DEST=C:\xampp\htdocs\smart_ambulance\"

if exist "%DEST%" (
    echo Destination folder already exists. Backing up...
    move "%DEST%" "C:\xampp\htdocs\smart_ambulance_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul 2>&1
)

mkdir "%DEST%" >nul 2>&1
xcopy "%SOURCE%*" "%DEST%" /E /I /Y /EXCLUDE:%SOURCE%exclude.txt >nul 2>&1

echo Files copied successfully!
echo.

REM Start XAMPP services
echo [3/5] Starting XAMPP services...
cd /d C:\xampp
start "" xampp-control.exe

echo Waiting for XAMPP Control Panel to open...
timeout /t 3 >nul
echo.

echo [4/5] Please manually start Apache and MySQL in XAMPP Control Panel
echo Then press any key to continue...
pause >nul
echo.

REM Open browser
echo [5/5] Opening dashboard in browser...
start http://localhost/smart_ambulance/

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Next Steps:
echo 1. In XAMPP Control Panel, ensure Apache and MySQL are RUNNING (green)
echo 2. Open phpMyAdmin: http://localhost/phpmyadmin
echo 3. Create database: smart_ambulance
echo 4. Import SQL file: database.sql (from the Website folder)
echo 5. Dashboard URL: http://localhost/smart_ambulance/
echo.
echo To find your local IP for ESP32:
echo - Open Command Prompt
echo - Type: ipconfig
echo - Look for "IPv4 Address" (e.g., 192.168.1.100)
echo - Update ESP32 code with: http://192.168.1.100/smart_ambulance/api/upload.php
echo.
pause
