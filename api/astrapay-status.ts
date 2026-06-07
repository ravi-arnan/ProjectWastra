/**
 * GET /api/astrapay-status?intent=<token>
 * Returns the current payment status.
 *
 * When the service role is configured, the payments row is the source of truth:
 * the webhook updates it (live), or — in mock mode — we advance a still-PENDING
 * row to PAID/EXPIRED based on its persisted timestamps and write that back.
 * Without the service role, falls back to the stateless mock/live query.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  decodeIntent,
  queryStatus,
  evaluateMockPending,
  isMockMode,
  type PaymentStatus,
} from '../server/astrapay'
import { hasAdmin, getPayment, updatePaymentStatus } from '../server/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query?.intent ?? (req.body as { intent?: unknown } | undefined)?.intent
  const token = Array.isArray(raw) ? raw[0] : raw

  if (typeof token !== 'string' || token.length === 0) {
    return res.status(400).json({ success: false, error: 'intent is required' })
  }

  const intent = decodeIntent(token)
  if (!intent) {
    return res.status(400).json({ success: false, error: 'invalid intent' })
  }

  try {
    let status: PaymentStatus

    const row = hasAdmin() ? await getPayment(intent.ref) : null
    if (row) {
      status = row.status as PaymentStatus
      if (status === 'PENDING') {
        const createdAtMs = Date.parse(row.created_at)
        const expiresAtMs = row.expires_at ? Date.parse(row.expires_at) : null
        const next = isMockMode()
          ? evaluateMockPending(createdAtMs, expiresAtMs)
          : await queryStatus(intent) // live fallback poll against AstraPay
        if (next !== 'PENDING') {
          await updatePaymentStatus(intent.ref, next)
          status = next
        }
      }
    } else {
      // No persisted row (service role absent, or charge predates the table).
      status = await queryStatus(intent)
    }

    return res.status(200).json({
      success: true,
      data: { referenceNo: intent.ref, status },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to query status'
    console.error('[astrapay-status]', message)
    return res.status(502).json({ success: false, error: 'Payment provider error' })
  }
}
