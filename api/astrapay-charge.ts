/**
 * POST /api/astrapay-charge
 * Body: { orderId: string, amount: number, destinationId?: string }
 * Creates a QRIS charge (mock or live AstraPay SNAP), persists a payments row
 * when the service role is configured, and returns the QR to render.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import QRCode from 'qrcode'
import { createCharge, isMockMode } from '../server/astrapay'
import { hasAdmin, insertPayment, getUserIdFromToken } from '../server/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { orderId, amount, destinationId } = (req.body ?? {}) as {
    orderId?: unknown
    amount?: unknown
    destinationId?: unknown
  }

  if (typeof orderId !== 'string' || orderId.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'orderId is required' })
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'amount must be a positive number' })
  }

  try {
    const charge = await createCharge(orderId.trim(), Math.round(amount))
    const qrImage = await QRCode.toDataURL(charge.qrString, { margin: 1, width: 256 })

    // Persist the charge so the webhook can update it and the client can poll
    // authoritative status. Best-effort: a DB failure must not block the QR.
    if (hasAdmin()) {
      const authHeader = req.headers.authorization
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
      const userId = await getUserIdFromToken(token)
      try {
        await insertPayment({
          reference_no: charge.referenceNo,
          order_id: orderId.trim(),
          destination_id: typeof destinationId === 'string' ? destinationId : null,
          user_id: userId,
          amount: charge.amount,
          qr_string: charge.qrString,
          expires_at: charge.expiresAt,
          status: 'PENDING',
        })
      } catch (dbError: unknown) {
        const msg = dbError instanceof Error ? dbError.message : 'unknown'
        console.error('[astrapay-charge] persist failed (continuing):', msg)
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        referenceNo: charge.referenceNo,
        amount: charge.amount,
        expiresAt: charge.expiresAt,
        status: charge.status,
        intent: charge.intent,
        qrImage,
        mock: isMockMode(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create charge'
    console.error('[astrapay-charge]', message)
    return res.status(502).json({ success: false, error: 'Payment provider error' })
  }
}
