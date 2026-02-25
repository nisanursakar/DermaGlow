@echo off
echo Android Studio kilit temizleniyor...
echo.

taskkill /F /IM studio64.exe 2>nul
taskkill /F /IM "Android Studio.exe" 2>nul
timeout /t 2 /nobreak >nul

powershell -ExecutionPolicy Bypass -File "%~dp0fix-android-studio-lock.ps1"

echo.
pause
