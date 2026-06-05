/**
 * POST /api/astrapay-charge
 * Body: { orderId: string, amount: number }
 * Creates a QRIS charge (mock or live AstraPay SNAP) and returns the QR to render.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import QRCode from 'qrcode'
import { createCharge, isMockMode } from './_lib/astrapay'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { orderId, amount } = (req.body ?? {}) as { orderId?: unknown; amount?: unknown }

  if (typeof orderId !== 'string' || orderId.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'orderId is required' })
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'amount must be a positive number' })
  }

  try {
    const charge = await createCharge(orderId.trim(), Math.round(amount))
    const qrImage = await QRCode.toDataURL(charge.qrString, { margin: 1, width: 256 })

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
