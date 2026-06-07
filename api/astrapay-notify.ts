/**
 * POST /api/astrapay-notify — AstraPay payment notification webhook.
 *
 * Verifies the inbound SNAP signature, then persists the final payment status
 * so the client's status poll resolves authoritatively. In mock mode (no
 * secret configured) the signature check is skipped; live mode rejects an
 * invalid or missing signature.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyNotificationSignature, mapSnapStatus, isMockMode } from '../server/astrapay.js'
import { hasAdmin, updatePaymentStatus } from '../server/supabaseAdmin.js'

const PATH = '/api/astrapay-notify'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ responseCode: '4050000', responseMessage: 'Method Not Allowed' })
  }

  const body = (req.body ?? {}) as {
    originalPartnerReferenceNo?: string
    latestTransactionStatus?: string
  }

  const signature = headerValue(req.headers['x-signature'])
  const timestamp = headerValue(req.headers['x-timestamp'])

  const verified = verifyNotificationSignature({
    method: 'POST',
    path: PATH,
    body,
    timestamp,
    signature,
  })
  if (!verified) {
    console.warn('[astrapay-notify] signature verification failed')
    return res.status(401).json({ responseCode: '4015200', responseMessage: 'Unauthorized. Invalid Signature' })
  }

  const referenceNo = body.originalPartnerReferenceNo
  const status = mapSnapStatus(body.latestTransactionStatus)

  if (referenceNo && hasAdmin()) {
    const ok = await updatePaymentStatus(referenceNo, status)
    if (!ok) console.error('[astrapay-notify] failed to persist status for', referenceNo)
  }

  console.log('[astrapay-notify] processed', { referenceNo, status, mock: isMockMode() })

  return res.status(200).json({ responseCode: '2005200', responseMessage: 'Successful' })
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
