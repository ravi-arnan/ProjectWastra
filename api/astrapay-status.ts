/**
 * GET /api/astrapay-status?intent=<token>
 * Returns the current payment status for a charge intent.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { decodeIntent, queryStatus } from './_lib/astrapay'

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
    const status = await queryStatus(intent)
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
