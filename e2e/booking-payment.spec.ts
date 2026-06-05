import 'dotenv/config'
import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end: ticket booking → AstraPay QRIS payment (mock) → confirmed ticket.
 *
 * Booking is gated behind a real (non-anonymous) Supabase session, so we seed a
 * synthetic session into localStorage before the app boots. This bypasses the
 * login UI only — the booking + payment flow under test runs for real against
 * the live dev-api endpoints.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://your-project.supabase.co'
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0]
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

function base64url(input: string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fakeSession() {
  const userId = '00000000-0000-4000-8000-000000000001'
  const farFuture = 4102444800 // year 2100, in seconds — avoids token refresh
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      aud: 'authenticated',
      role: 'authenticated',
      is_anonymous: false,
      exp: farFuture,
    })
  )
  const accessToken = `${header}.${payload}.e2e-signature`
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 999_999_999,
    expires_at: farFuture,
    refresh_token: 'e2e-refresh-token',
    user: {
      id: userId,
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
  const session = fakeSession()
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(session)] as const
  )
}

test('paid booking completes through AstraPay QRIS (mock)', async ({ page }) => {
  await seedAuth(page)

  // Uluwatu = Rp 50.000 (a paid ticket → triggers the payment step).
  await page.goto('/app/destinasi/uluwatu')

  // We are treated as a logged-in user, so the booking modal opens directly.
  await page.getByRole('button', { name: 'Pesan Tiket' }).first().click()

  const modal = page.getByRole('heading', { name: 'Pesan Tiket' })
  await expect(modal).toBeVisible()

  // Pick tomorrow as the visit date.
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
  await page.locator('input[type="date"]').fill(tomorrow)

  // Start payment.
  await page.getByRole('button', { name: /Bayar dengan AstraPay/ }).click()

  // QRIS payment view: simulation badge + QR image + waiting indicator.
  await expect(page.getByText('Pembayaran AstraPay')).toBeVisible()
  await expect(page.getByText(/Mode simulasi/)).toBeVisible()
  await expect(page.getByAltText('QRIS AstraPay')).toBeVisible()
  await expect(page.getByText(/Menunggu pembayaran/)).toBeVisible()

  // Mock auto-pays after ~1.5s; poll flips to PAID and the ticket is issued.
  await expect(page.getByText('Pemesanan Berhasil!')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Kode Tiket')).toBeVisible()
})

test('charge endpoint returns a QRIS in mock mode', async ({ request }) => {
  const res = await request.post('/api/astrapay-charge', {
    data: { orderId: 'e2e-smoke', amount: 50_000 },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.data.status).toBe('PENDING')
  expect(body.data.mock).toBe(true)
  expect(body.data.qrImage).toMatch(/^data:image\/png;base64,/)
})
