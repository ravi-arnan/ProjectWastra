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

## Google sign-in (native deep link)

Google blocks OAuth inside embedded WebViews, so native sign-in opens Google in
a system Custom Tab and returns to the app via a custom-scheme deep link:

```
com.wastra.app://auth-callback
```

Flow (`src/lib/nativeAuth.ts`, wired into `Auth.tsx`):
1. `signInWithOAuth({ provider: 'google', skipBrowserRedirect: true, redirectTo: <deep link> })`
2. open the returned URL with `@capacitor/browser`
3. catch the redirect via `App.addListener('appUrlOpen', ...)` (intent-filter in
   `AndroidManifest.xml`)
4. `exchangeCodeForSession` (PKCE) or `setSession` (implicit), then route to `/app`

> ⚠️ **One dashboard step required:** add `com.wastra.app://auth-callback` to
> **Supabase → Authentication → URL Configuration → Redirect URLs**. No Google
> Cloud Console change is needed — Google still redirects to the Supabase
> callback; only Supabase's post-exchange redirect must allow the deep link.

Email/password and guest sign-in work without any of this.

## App icon & splash

Branded launcher icons (incl. adaptive) and light/dark splash screens are
generated from `src/assets/wastra_logo.png` on the `#fff8f5` brand surface:

```bash
node scripts/generate-app-icons.mjs   # logo → assets/ source set (uses sharp)
npx @capacitor/assets generate --android   # assets/ → every Android density
```

Re-run both whenever the logo changes, then rebuild the APK.

## Release build & signing

Debug APKs (`cap:apk`) are signed with the shared Android debug key — fine for
testing, not for distribution. A release build is signed with **your** keystore,
configured via `android/keystore.properties` (git-ignored, never committed).

1. Create a keystore once (back up the `.jks` **and** the passwords — losing them
   means you can never ship an update):

   ```bash
   keytool -genkeypair -v -keystore android/wastra-release.jks \
     -alias wastra -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Copy the template and fill it in:

   ```bash
   cp android/keystore.properties.example android/keystore.properties
   # edit storeFile / storePassword / keyAlias / keyPassword
   ```

3. Build the signed artifact:

   ```bash
   npm run cap:apk:release   # → android/app/build/outputs/apk/release/app-release.apk
   npm run cap:aab:release   # → android/app/build/outputs/bundle/release/app-release.aab (Play Store)
   ```

`android/app/build.gradle` reads the keystore from `keystore.properties`; if that
file is absent the release build falls back to debug signing, so contributors and
CI without the keystore can still assemble (non-distributable) release builds.

Bump `versionCode` / `versionName` in `android/app/build.gradle` for each release.
