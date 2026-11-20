# A Star Swim Schools — Standalone Mobile App Package

This package contains everything needed to build **production-ready Android (APK/AAB)** and **iOS (IPA)** apps using Capacitor.

Because the app is configured in **Remote Server URL mode**, it connects directly to your live production deployment:
`https://www.astarswimmanagement.com` (with fallback to `https://swim-school-management-system.vercel.app`)

Any web update deployed to Vercel instantly reflects inside the installed apps without rebuilding or resubmitting to the app stores.

---

## Prerequisites on Your Other Computer

1. **Node.js** (v18+ or v20+): [https://nodejs.org](https://nodejs.org)
2. For Android builds: **Android Studio**: [https://developer.android.com/studio](https://developer.android.com/studio)
3. For iOS builds (Mac only): **Xcode** (from the Mac App Store)

---

## Quick Start (Build APK in 2 Minutes)

### On Windows:
1. Double-click `setup-and-build.bat` (or open PowerShell in this folder and run `.\setup-and-build.bat`).
2. The script installs the lightweight plugins, adds the Android platform, syncs the files, and launches Android Studio.
3. In Android Studio, wait for Gradle sync to complete, then click:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Click **locate** in the popup to retrieve `app-debug.apk`.

### On macOS / Linux:
1. Open Terminal in this folder.
2. Run:
   ```bash
   chmod +x setup-and-build.sh
   ./setup-and-build.sh
   ```
3. Choose `1` for Android Studio or `2` for Xcode.

---

## Manual Commands

If you prefer running commands manually:

```bash
# 1. Install dependencies
npm install

# 2. Add Android or iOS
npx cap add android
npx cap add ios

# 3. Synchronize
npx cap sync

# 4. Open in native IDE
npx cap open android   # Launches Android Studio
npx cap open ios       # Launches Xcode (macOS only)
```
