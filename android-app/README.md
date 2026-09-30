# Hisaab — Android app

The app is `../billing-app.html` wrapped with Capacitor. Edit that file, then rebuild.

## Rebuild the APK

```sh
cd android-app
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
npm run apk
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
Copy it to the phone (WhatsApp, USB, Google Drive) and open it to install
(Android asks once to allow installs from that source).

## How it works

- `build.mjs` copies `../billing-app.html` to `www/index.html`, stores the fonts
  locally (works offline) and bundles `src/native.js`.
- `src/native.js` gives the page three things on Android:
  - **Data**: everything is kept in one compact JSON file (`hisaab-data.json`)
    in the app's private storage, with the previous copy kept as
    `hisaab-data.prev.json` in case a write is interrupted.
  - **Share**: backups, CSV exports and bills go through Android's share sheet
    (WhatsApp, Drive, Files, print).
  - **PDF**: bills are turned into A4 PDFs on the phone.
- Uninstalling the app deletes its data. Use **Settings → Backup & data →
  Save / share backup** regularly, and **Restore from backup** on a new phone.
