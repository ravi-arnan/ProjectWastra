/**
 * POST /api/astrapay-notify  — AstraPay payment notification webhook.
 *
 * Skeleton: acknowledges with a SNAP-style envelope. When live credentials are
 * configured, this is where we (1) verify the inbound X-SIGNATURE, and
 * (2) persist the final payment status (e.g. a Supabase `payments` row) so the
 * client's status poll resolves authoritatively instead of via the mock timer.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isMockMode } from './_lib/astrapay'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      responseCode: '4050000',
      responseMessage: 'Method Not Allowed',
    })
  }

  const body = (req.body ?? {}) as {
    originalPartnerReferenceNo?: string
    latestTransactionStatus?: string
  }

  // TODO(live): verify X-SIGNATURE header against the SNAP symmetric signature
  // before trusting this payload, then upsert the payment status by reference.
  if (!isMockMode()) {
    // await persistPaymentStatus(body.originalPartnerReferenceNo, body.latestTransactionStatus)
  }

  console.log('[astrapay-notify] received', {
    ref: body.originalPartnerReferenceNo,
    status: body.latestTransactionStatus,
    mock: isMockMode(),
  })

  return res.status(200).json({
    responseCode: '2005200',
    responseMessage: 'Successful',
  })
}
