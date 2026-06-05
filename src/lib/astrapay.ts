/**
 * Client wrapper for the AstraPay payment endpoints.
 * The server signs/calls AstraPay; the client only ever sees the QR + status.
 */
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'

export interface ChargeData {
  referenceNo: string
  amount: number
  expiresAt: string
  status: PaymentStatus
  intent: string
  qrImage: string
  mock: boolean
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: string
}

export async function createCharge(orderId: string, amount: number): Promise<ChargeData> {
  const res = await fetch('/api/astrapay-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount }),
  })
  const json = (await res.json()) as Envelope<ChargeData>
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || 'Gagal membuat pembayaran')
  }
  return json.data
}

export async function fetchStatus(intent: string): Promise<PaymentStatus> {
  const res = await fetch(`/api/astrapay-status?intent=${encodeURIComponent(intent)}`)
  const json = (await res.json()) as Envelope<{ referenceNo: string; status: PaymentStatus }>
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || 'Gagal memeriksa status pembayaran')
  }
  return json.data.status
}

/**
 * Poll status until it resolves to a terminal state or the signal aborts.
 * Returns the terminal status ('PAID' | 'EXPIRED' | 'FAILED').
 */
export async function pollUntilSettled(
  intent: string,
  options: { signal?: AbortSignal; intervalMs?: number } = {}
): Promise<PaymentStatus> {
  const intervalMs = options.intervalMs ?? 2000
  for (;;) {
    if (options.signal?.aborted) return 'PENDING'
    const status = await fetchStatus(intent)
    if (status !== 'PENDING') return status
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs))
  }
}
