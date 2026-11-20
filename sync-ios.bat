@echo off
echo ===================================================
echo   A Star Swim Schools - Sync iOS Configuration
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/3] Refreshing iOS native icons from master Star logo...
powershell -ExecutionPolicy Bypass -File .\generate-ios-icons.ps1

echo [2/3] Running Capacitor iOS Sync...
call npx.cmd cap sync ios

echo [3/3] iOS Project is up to date!
echo Xcode workspace ready at: ios\App\App.xcworkspace
echo.
pause
