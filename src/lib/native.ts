/**
 * Native-only bootstrap for the Capacitor Android shell.
 *
 * Imported dynamically from main.tsx and guarded by `isNative`, so none of the
 * Capacitor plugin code lands in the web bundle's critical path.
 */
import { isNative } from './platform'

export async function initNative(): Promise<void> {
  if (!isNative) return

  const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
    import('@capacitor/app'),
  ])

  // Match the app's warm background and use dark icons on the light status bar.
  try {
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#fff8f5' })
  } catch {
    // Status bar styling is best-effort; ignore on unsupported devices.
  }

  // Hardware back button: go back through history, or exit at the root.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })

  // Reveal the WebView once the app has mounted.
  try {
    await SplashScreen.hide()
  } catch {
    // ignore — splash may already be hidden.
  }
}
