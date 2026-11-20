@echo off
echo ===================================================
echo  A Star Swim Schools - Mobile App Initializer
echo ===================================================
echo.

echo [1/4] Installing Capacitor dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install npm dependencies. Make sure Node.js is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Initializing Android and iOS platforms...
if not exist "android" (
    call npx cap add android
)
if not exist "ios" (
    call npx cap add ios
)

echo.
echo [3/4] Syncing web configuration and native plugins...
call npx cap sync

echo.
echo [4/4] Opening Android Studio...
call npx cap open android

echo.
echo ===================================================
echo Done! Android Studio is opening.
echo Once Gradle finishes syncing:
echo Go to "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
echo ===================================================
pause
