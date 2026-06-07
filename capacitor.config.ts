import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor config for the Wastra Android app.
 *
 * The web build in `dist/` is shipped inside the APK and served from the
 * `https://localhost` scheme. Because the WebView origin is no longer the
 * Vercel domain, two things matter here:
 *  - CapacitorHttp patches `fetch`/`XHR` to go through native HTTP, so calls to
 *    the deployed `/api` routes work without CORS preflight headaches.
 *  - Relative `/api` paths are rewritten to the deployed origin at runtime
 *    (see src/lib/platform.ts) — Capacitor only handles the transport.
 */
const config: CapacitorConfig = {
  appId: 'com.wastra.app',
  appName: 'Wastra',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#fff8f5',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
}

export default config
