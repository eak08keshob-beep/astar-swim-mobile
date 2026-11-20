#!/usr/bin/env bash
set -e

echo "==================================================="
echo " A Star Swim Schools - Mobile App Initializer (Mac/Linux)"
echo "==================================================="
echo ""

echo "[1/4] Installing Capacitor dependencies..."
npm install

echo ""
echo "[2/4] Initializing Android and iOS platforms..."
if [ ! -d "android" ]; then
  npx cap add android
fi
if [ ! -d "ios" ]; then
  npx cap add ios
fi

echo ""
echo "[3/4] Syncing native platforms..."
npx cap sync

echo ""
echo "Select platform to open:"
echo "1) Android Studio (APK / AAB)"
echo "2) Xcode (iOS IPA / TestFlight)"
echo "3) Exit"
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    npx cap open android
    ;;
  2)
    npx cap open ios
    ;;
  *)
    echo "Done."
    ;;
esac
