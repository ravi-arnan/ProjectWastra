/**
 * Minimal PostgREST admin client for server-side payment writes.
 *
 * Uses the Supabase service-role key, which bypasses RLS — so it must never be
 * imported into client code. When the key is absent (e.g. local dev without it
 * configured), hasAdmin() is false and callers gracefully fall back to the
 * stateless mock path instead of writing to the database.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

export interface PaymentRow {
  reference_no: string
  order_id: string
  destination_id?: string | null
  user_id?: string | null
  amount: number
  qr_string?: string | null
  expires_at?: string | null
  status?: string
}

export interface PaymentRecord {
  status: string
  created_at: string
  expires_at: string | null
}

export function hasAdmin(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY)
}

function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SERVICE_KEY as string,
    Authorization: `Bearer ${SERVICE_KEY as string}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export async function insertPayment(row: PaymentRow): Promise<void> {
  if (!hasAdmin()) return
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
    method: 'POST',
    headers: adminHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    throw new Error(`insertPayment ${res.status}: ${await res.text()}`)
  }
}

export async function getPayment(referenceNo: string): Promise<PaymentRecord | null> {
  if (!hasAdmin()) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/payments?reference_no=eq.${encodeURIComponent(referenceNo)}&select=status,created_at,expires_at`,
    { headers: adminHeaders() }
  )
  if (!res.ok) return null
  const rows = (await res.json()) as PaymentRecord[]
  return rows[0] ?? null
}

export async function updatePaymentStatus(referenceNo: string, status: string): Promise<boolean> {
  if (!hasAdmin()) return false
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/payments?reference_no=eq.${encodeURIComponent(referenceNo)}`,
    {
      method: 'PATCH',
      headers: adminHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ status }),
    }
  )
  return res.ok
}

/** Resolve a Supabase user id from a bearer token (best-effort, for attribution). */
export async function getUserIdFromToken(token: string | undefined): Promise<string | null> {
  if (!token || !SUPABASE_URL || !ANON_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const user = (await res.json()) as { id?: string; is_anonymous?: boolean }
    if (!user.id || user.is_anonymous) return null
    return user.id
  } catch {
    return null
  }
}
