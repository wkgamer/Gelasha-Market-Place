# Building a Development Build

Since Expo SDK 53 removed push notifications from Expo Go, a **Development Build** is required.

## Steps

### 1. Install EAS CLI (on your computer)
```bash
npm install -g eas-cli
```

### 2. Log in to Expo account
```bash
eas login
```

### 3. Initialize EAS for this project
```bash
cd artifacts/mobile
eas init
```
This creates your EAS project and fills in the `extra.eas.projectId` in `app.json` automatically.

### 4. Build the Development APK (Android)
```bash
eas build --profile development --platform android
```
This uploads the code to EAS servers and builds an APK you can install on your device.

### 5. Install on your Android device
- Download the APK from the link EAS gives you
- Install it on your Android device
- Open the app — it will connect to the Expo dev server just like Expo Go, but with full native module support

### 6. Run the dev server (already running in Replit)
The Expo dev server is already running. Scan the QR code from within the development build app.

---

## What changes with a Development Build

| Feature | Expo Go | Development Build |
|---|---|---|
| expo-notifications local | ✅ | ✅ |
| expo-notifications remote push | ❌ (SDK 53) | ✅ |
| expo-dev-client | ❌ | ✅ |
| All native modules | ❌ | ✅ |
| Hot reload | ✅ | ✅ |
