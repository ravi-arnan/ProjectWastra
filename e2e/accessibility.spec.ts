import 'dotenv/config'
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Automated WCAG 2.0/2.1 A + AA audit (axe-core) across the key routes.
 *
 * Public routes run without a session. App routes seed a synthetic Supabase
 * session into localStorage (same trick as booking-payment.spec.ts) so the
 * protected shell renders without going through the live login UI.
 *
 * Decorative WebGL/canvas surfaces (Aurora, OGL gallery, Leaflet tiles) are
 * excluded — they are `aria-hidden` presentation layers, not content, and
 * axe's color-contrast pass cannot read pixels off a <canvas>.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://your-project.supabase.co'
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0]
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

function base64url(input: string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const USER_ID = '00000000-0000-4000-8000-000000000001'

function fakeSession() {
  const farFuture = 4102444800
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({ sub: USER_ID, aud: 'authenticated', role: 'authenticated', is_anonymous: false, exp: farFuture }),
  )
  return {
    access_token: `${header}.${payload}.e2e-signature`,
    token_type: 'bearer',
    expires_in: 999_999_999,
    expires_at: farFuture,
    refresh_token: 'e2e-refresh-token',
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@wastra.id',
      is_anonymous: false,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'E2E Tester' },
      created_at: '2025-01-01T00:00:00.000Z',
    },
  }
}

async function seedAuth(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(fakeSession())] as const,
  )
  // Stub the community reviews query so the destination-detail review list
  // renders populated (author, stars, comment) under audit instead of just the
  // empty state.
  await page.route('**/rest/v1/reviews*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '00000000-0000-4000-8000-0000000000aa',
          destination_id: 'uluwatu',
          author_name: 'E2E Tester',
          rating: 5,
          comment: 'Pemandangan sunset-nya luar biasa, datang sore hari.',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ]),
    }),
  )
}

// Promote the seeded session to admin by stubbing the role-check queries that
// AuthContext fires against PostgREST, so DashboardRoute renders. The dashboard
// pages read the static destinations dataset (not Supabase), so they populate
// fully without further mocking.
async function seedAdmin(page: Page) {
  await seedAuth(page)
  await page.route('**/rest/v1/admins*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user_id: USER_ID }) }),
  )
  await page.route('**/rest/v1/local_managers*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
  )
}

function audit(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Canvas/WebGL decorative layers — not content, unreadable by contrast checks.
    .exclude('canvas')
    .exclude('.leaflet-container')
    // Purely decorative, aria-hidden typographic texture (e.g. the ghosted
    // place-name marquee). Intentionally low-contrast; conveys no information.
    .exclude('[data-decorative]')
}

const publicRoutes = [
  { path: '/', name: 'Landing' },
  { path: '/auth', name: 'Auth' },
  { path: '/privacy', name: 'Legal (privacy)' },
  { path: '/terms', name: 'Legal (terms)' },
]

for (const route of publicRoutes) {
  test(`a11y: ${route.name} (${route.path}) has no serious/critical violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route.path)
    await page.waitForLoadState('networkidle')
    // Let opacity/whileInView reveals settle so axe doesn't sample mid-fade.
    await page.waitForTimeout(800)
    const results = await audit(page).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    if (blocking.length) {
      for (const v of blocking) {
        for (const n of v.nodes) {
          console.log(`AXE|${route.name}|${v.id}|${n.target.join(' ')}|${n.html.replace(/\n/g, ' ').slice(0, 140)}`)
        }
      }
    }
    expect(blocking).toEqual([])
  })
}

// Member-facing routes reachable with the seeded (non-admin) session.
const appRoutes = [
  { path: '/app', name: 'Home' },
  { path: '/app/peta', name: 'Peta' },
  { path: '/app/destinasi', name: 'Destinasi' },
  { path: '/app/destinasi/uluwatu', name: 'Destination detail' },
  { path: '/app/bandingkan', name: 'Bandingkan' },
  { path: '/app/prediksi', name: 'Prediksi' },
  { path: '/app/watchlist', name: 'Watchlist' },
  { path: '/app/profil', name: 'Profil' },
  { path: '/app/ai-analysis', name: 'AI Analysis' },
]

for (const route of appRoutes) {
  test(`a11y: ${route.name} (${route.path}) has no serious/critical violations`, async ({ page }) => {
    await seedAuth(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route.path)
    await page.waitForLoadState('networkidle')
    // Let opacity/whileInView reveals settle so axe doesn't sample mid-fade.
    await page.waitForTimeout(800)
    const results = await audit(page).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    if (blocking.length) {
      for (const v of blocking) {
        for (const n of v.nodes) {
          console.log(`AXE|${route.name}|${v.id}|${n.target.join(' ')}|${n.html.replace(/\n/g, ' ').slice(0, 140)}`)
        }
      }
    }
    expect(blocking).toEqual([])
  })
}

// Pengelola dashboard — gated by DashboardRoute (admin or local-manager role).
// These pages read the static destinations dataset, so the role mock is enough
// to render them fully.
const dashboardRoutes = [
  { path: '/dashboard', name: 'Dashboard overview' },
  { path: '/dashboard/peta', name: 'Dashboard map' },
  { path: '/dashboard/prediksi', name: 'Dashboard prediksi' },
  { path: '/dashboard/laporan', name: 'Dashboard laporan' },
  { path: '/dashboard/destinasi', name: 'Dashboard destinasi' },
]

for (const route of dashboardRoutes) {
  test(`a11y: ${route.name} (${route.path}) has no serious/critical violations`, async ({ page }) => {
    await seedAdmin(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route.path)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const results = await audit(page).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    if (blocking.length) {
      for (const v of blocking) {
        for (const n of v.nodes) {
          console.log(`AXE|${route.name}|${v.id}|${n.target.join(' ')}|${n.html.replace(/\n/g, ' ').slice(0, 140)}`)
        }
      }
    }
    expect(blocking).toEqual([])
  })
}
