/**
 * Native (Capacitor) Google sign-in.
 *
 * Google blocks OAuth inside embedded WebViews, so instead of letting Supabase
 * do a full-page redirect we:
 *   1. ask Supabase for the provider URL (skipBrowserRedirect),
 *   2. open it in a system Custom Tab via @capacitor/browser,
 *   3. wait for Supabase to redirect to our deep link (appUrlOpen),
 *   4. exchange the returned code/tokens for a session.
 *
 * This module is dynamically imported only on native (see Auth.tsx), so the
 * browser/app plugins never load on the web.
 */
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import { supabase } from './supabase'
import { NATIVE_AUTH_REDIRECT } from './platform'

const SIGN_IN_TIMEOUT_MS = 120_000

export async function signInWithGoogleNative(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Supabase returned no OAuth URL')

  // Register the deep-link listener BEFORE opening the browser so we never miss
  // a fast redirect.
  let resolveCallback!: (url: string) => void
  let rejectCallback!: (err: Error) => void
  const callbackUrl = new Promise<string>((resolve, reject) => {
    resolveCallback = resolve
    rejectCallback = reject
  })

  const listener = await App.addListener('appUrlOpen', ({ url }) => {
    if (url.startsWith(NATIVE_AUTH_REDIRECT)) resolveCallback(url)
  })
  const timer = setTimeout(
    () => rejectCallback(new Error('Google sign-in timed out')),
    SIGN_IN_TIMEOUT_MS,
  )

  try {
    await Browser.open({ url: data.url, presentationStyle: 'popover' })
    const url = await callbackUrl
    await Browser.close().catch(() => {})
    await completeSession(url)
  } finally {
    clearTimeout(timer)
    await listener.remove()
  }
}

/** Exchange the deep-link callback for a Supabase session (PKCE or implicit). */
async function completeSession(callbackUrl: string): Promise<void> {
  const parsed = new URL(callbackUrl)

  const code = parsed.searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return
  }

  const fragment = new URLSearchParams(callbackUrl.split('#')[1] ?? '')
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')
  if (!accessToken || !refreshToken) {
    const description = parsed.searchParams.get('error_description')
    throw new Error(description || 'Sign-in callback contained no code or tokens')
  }
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (error) throw error
}
