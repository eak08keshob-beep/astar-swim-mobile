# A Star Swim Schools — iOS Publishing & TestFlight Guide

This document details how to build the iOS app (`.ipa`), test it on iPhone, and publish it to the Apple App Store.

---

## 1. Project Configuration Summary

| Setting | Value |
| :--- | :--- |
| **App Name** | **A Star Swim Schools** *(Display: `A Star Swim`)* |
| **Bundle Identifier** | **`com.astarswimschools.parent`** |
| **Apple Team ID** | **`DH67Z886MU`** |
| **Target URL** | **`https://www.astarswimmanagement.com/`** |
| **Custom URL Scheme** | `astarswim://` |
| **Version** | `1.0.4` (Build `5`) |
| **Xcode Project** | `ios/App/App.xcodeproj` |
| **Xcode Workspace** | `ios/App/App.xcworkspace` |

---

## 2. Option A: Build `.ipa` Directly from Windows (GitHub Actions)

Because Apple tools run on macOS, we have configured **GitHub Actions** (`.github/workflows/build-ios.yml`) to compile and package your `.ipa` in the cloud on a high-speed macOS runner.

### Step 1: Push Project to GitHub
1. Create a GitHub repository (private or public).
2. Push your project folder to GitHub.

### Step 2: Run Workflow
1. In your GitHub repository, click the **Actions** tab.
2. Select **"Build & Package iOS App (.IPA)"** on the left menu.
3. Click **Run workflow**.

### Step 3: Download the Compiled `.ipa`
1. When the run finishes (~3-4 minutes), scroll down to the **Artifacts** section at the bottom of the run page.
2. Click **`AStarSwimSchools-iOS-IPA`** to download `AStarSwimSchools-Production.ipa` straight to your Windows laptop!

---

## 3. Option B: Build via Any Mac (Friend's Mac, MacinCloud, or Office)

If you have access to a Mac computer:

1. Copy the `mobile-app-package` folder to the Mac (or clone your GitHub repo).
2. Open Terminal in the `mobile-app-package` folder and run:
   ```bash
   npm install
   npx cap sync ios
   cd ios/App
   pod install
   ```
3. Open `ios/App/App.xcworkspace` in **Xcode**.
4. Sign in with your Apple Developer Apple ID in **Xcode &rarr; Settings &rarr; Accounts**.
5. Select the **App** project in the navigator &rarr; go to **Signing & Capabilities**:
   - Ensure **"Automatically manage signing"** is checked.
   - Select Team: **`DH67Z886MU`**.
6. Select target device: **Any iOS Device (arm64)**.
7. Click **Product &rarr; Archive**.
8. Once the Organizer window pops up:
   - Click **Distribute App**.
   - Select **App Store Connect &rarr; TestFlight & App Store**.
   - Click **Upload**.

---

## 4. Setting up App Store Connect & TestFlight

### Step 1: Register the App in App Store Connect (1 Minute)
1. Go to [https://appstoreconnect.apple.com/apps](https://appstoreconnect.apple.com/apps).
2. Click the **`+`** button &rarr; **New App**.
3. Fill in:
   - **Platforms:** iOS
   - **Name:** A Star Swim Schools
   - **Primary Language:** English
   - **Bundle ID:** Choose `com.astarswimschools.parent` (if not listed, add it under [developer.apple.com Identifiers](https://developer.apple.com/account/resources/identifiers/list)).
   - **SKU:** `astarswim01`
   - **User Access:** Full Access
4. Click **Create**.

### Step 2: Invite Testers via TestFlight
1. In App Store Connect, click on your app &rarr; click the **TestFlight** tab at the top.
2. Once the build is uploaded, it will process for ~5-10 minutes.
3. Under **Internal Testing**, click **`+`** to add yourself or your team members.
4. Testers receive an email with an invite link.
5. On your iPhone:
   - Install the free **TestFlight** app from the App Store.
   - Tap the link in your email (or enter the redeem code).
   - Tap **Install**!

---

## 5. Testing from Windows

- **Appetize.io:** Visit [https://appetize.io/upload](https://appetize.io/upload) and upload your `.ipa` or simulator build to interact with a virtual iPhone streaming inside Chrome on your PC.
- **Apple TestFlight:** Install the build on any physical iPhone with one tap.
