/**
 * Platform helpers for running the same web build on the web and inside the
 * Capacitor Android shell.
 *
 * On the web the app is same-origin with its `/api` routes and OAuth callbacks,
 * so relative paths and `window.location.origin` are correct. Inside the APK
 * the WebView origin is `https://localhost`, which has no backend and is not a
 * registered OAuth redirect — so both must point at the deployed site instead.
 */
import { Capacitor } from '@capacitor/core'

/** Deployed origin that serves the API routes and is registered for OAuth. */
const DEPLOYED_ORIGIN = 'https://project-wastra.vercel.app'

/**
 * Custom-scheme deep link Supabase redirects to after native Google sign-in.
 * Must be added to Supabase → Authentication → URL Configuration → Redirect URLs.
 * Mirrored by the intent-filter in android/app/src/main/AndroidManifest.xml.
 */
export const NATIVE_AUTH_REDIRECT = 'com.wastra.app://auth-callback'

/** True when running inside the native Capacitor shell (Android/iOS). */
export const isNative = Capacitor.isNativePlatform()

/**
 * Resolve an `/api/...` path to an absolute URL.
 * Web: returns the relative path (same-origin). Native: prefixes the deployed
 * origin (overridable with VITE_API_BASE for staging builds).
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!isNative) return normalized
  const base = import.meta.env.VITE_API_BASE || DEPLOYED_ORIGIN
  return `${base.replace(/\/$/, '')}${normalized}`
}

/**
 * Origin to use for auth redirects (OAuth callback, email confirmation, password
 * reset). Web uses the live origin; native uses the deployed site so the link
 * resolves to a real https URL Google/Supabase will accept.
 */
export function appOrigin(): string {
  if (!isNative) return window.location.origin
  // Strip any trailing slash so call sites like `${appOrigin()}/auth` never
  // produce `...//auth`, which breaks strict OAuth redirect matching.
  return (import.meta.env.VITE_APP_URL || DEPLOYED_ORIGIN).replace(/\/$/, '')
}
