# Wastra — Android APK (Capacitor)

The Android app is the **same web build** (`dist/`) packaged with
[Capacitor](https://capacitorjs.com/). There is no separate UI codebase — the
React app runs inside a native WebView served from the `https://localhost`
scheme. The deployed Vercel site (`https://project-wastra.vercel.app`) stays the
source of truth for the **API routes** and **OAuth callbacks**; the APK calls
into it.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node | **≥ 22** | `@capacitor/cli` 8.x declares a Node ≥ 22 engine |
| JDK | **21 (full JDK, not JRE)** | Capacitor 8's Android libs target Java 21 |
| Android SDK | platform 36 + build-tools | `ANDROID_HOME` or `android/local.properties` |

`android/local.properties` (git-ignored) must point Gradle at the SDK:

```
sdk.dir=/home/<you>/Android/Sdk
```

> ⚠️ A JRE will fail with `Toolchain ... does not provide JAVA_COMPILER`.
> A JDK 17 will fail with `invalid source release: 21`. You need a full **JDK 21**.

## Build the debug APK

```bash
# one-shot: build web → sync → assemble
JAVA_HOME=/path/to/jdk-21 ANDROID_HOME=$HOME/Android/Sdk npm run cap:apk
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Other scripts:

- `npm run cap:sync` — rebuild web and copy into the native project
- `npm run cap:open` — open the project in Android Studio

## Web ↔ native differences

`src/lib/platform.ts` centralizes the two things that differ in the APK:

- **`apiUrl(path)`** — on web returns the relative `/api/...` (same origin); on
  native prefixes the deployed origin (override with `VITE_API_BASE`).
- **`appOrigin()`** — origin used for auth redirects; native uses the deployed
  site (override with `VITE_APP_URL`) so Google/Supabase get a real https URL.

`CapacitorHttp` is enabled in `capacitor.config.ts` so native `fetch` goes
through native HTTP and avoids CORS preflight against the API.

The `cap:*` scripts set `CAP_BUILD=true`, which makes `vite.config.ts` drop the
`vite-plugin-pwa` service worker from native builds (redundant in the APK and a
source of stale-asset bugs after an app update). Web builds keep the PWA.

## Known follow-ups

1. **Google sign-in returns to the website, not the app.** Native OAuth needs a
   deep link: register a custom scheme / App Link, set Supabase's redirect to it,
   open the flow with `@capacitor/browser`, and catch the callback via
   `App.addListener('appUrlOpen', ...)`. Until then, **email/password sign-in
   works fully** inside the APK.
2. **Release build / signing.** This is an unsigned *debug* APK. For a
   distributable build, configure a keystore and run `assembleRelease`.

## App icon & splash

Branded launcher icons (incl. adaptive) and light/dark splash screens are
generated from `src/assets/wastra_logo.png` on the `#fff8f5` brand surface:

```bash
node scripts/generate-app-icons.mjs   # logo → assets/ source set (uses sharp)
npx @capacitor/assets generate --android   # assets/ → every Android density
```

Re-run both whenever the logo changes, then rebuild the APK.
