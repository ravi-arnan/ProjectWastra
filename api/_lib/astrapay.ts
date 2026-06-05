/**
 * AstraPay SNAP integration helpers (shared by api/astrapay-*.ts).
 *
 * Files under api/_lib are ignored by Vercel's filesystem routing and by the
 * dev-api proxy, so this is library code — not an HTTP endpoint.
 *
 * AstraPay follows SNAP (Standar Nasional Open API Pembayaran, Bank Indonesia).
 * Until the team receives sandbox credentials from the hackathon organizer,
 * this runs in MOCK mode: it returns realistically-shaped QRIS responses and
 * auto-confirms payment after a short delay so the booking flow is demoable.
 * When real credentials land, set the ASTRAPAY_* env vars and the same code
 * paths sign + call the live SNAP endpoints — the public contract is identical.
 */
import { createHash, createHmac, createSign, randomUUID } from 'node:crypto'

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'

export interface ChargeIntent {
  ref: string
  amount: number
  issuedAt: number
}

export interface ChargeResult {
  referenceNo: string
  qrString: string
  amount: number
  expiresAt: string
  status: PaymentStatus
  /** Opaque token the client passes back to /api/astrapay-status. */
  intent: string
}

const MOCK_PAY_DELAY_MS = Number(process.env.ASTRAPAY_MOCK_PAY_DELAY_MS ?? 6000)
const EXPIRES_MS = Number(process.env.ASTRAPAY_QR_EXPIRES_MS ?? 5 * 60 * 1000)

interface AstraPayConfig {
  baseUrl: string
  clientKey: string
  clientSecret: string
  privateKey: string
  merchantId: string
}

/**
 * Live mode requires every credential to be present. Missing any one → MOCK.
 * Keeps secrets server-side only; nothing here is ever sent to the client.
 */
export function getConfig(): AstraPayConfig | null {
  const baseUrl = process.env.ASTRAPAY_BASE_URL
  const clientKey = process.env.ASTRAPAY_CLIENT_KEY
  const clientSecret = process.env.ASTRAPAY_CLIENT_SECRET
  const privateKey = process.env.ASTRAPAY_PRIVATE_KEY
  const merchantId = process.env.ASTRAPAY_MERCHANT_ID
  if (!baseUrl || !clientKey || !clientSecret || !privateKey || !merchantId) {
    return null
  }
  return { baseUrl, clientKey, clientSecret, privateKey, merchantId }
}

export function isMockMode(): boolean {
  return getConfig() === null
}

// --- SNAP signing primitives (used only in live mode) -----------------------

/** Asymmetric signature for the B2B access-token request: SHA256withRSA. */
export function signAccessToken(clientKey: string, timestamp: string, privateKey: string): string {
  const signer = createSign('RSA-SHA256')
  signer.update(`${clientKey}|${timestamp}`)
  signer.end()
  return signer.sign(privateKey, 'base64')
}

/** Symmetric per-transaction signature: HMAC-SHA512 over the SNAP string-to-sign. */
export function signTransaction(args: {
  method: string
  path: string
  accessToken: string
  body: unknown
  timestamp: string
  clientSecret: string
}): string {
  const bodyHash = createHash('sha256')
    .update(JSON.stringify(args.body))
    .digest('hex')
    .toLowerCase()
  const stringToSign = `${args.method}:${args.path}:${args.accessToken}:${bodyHash}:${args.timestamp}`
  return createHmac('sha512', args.clientSecret).update(stringToSign).digest('base64')
}

// --- Intent token (stateless payment handle) --------------------------------

export function encodeIntent(intent: ChargeIntent): string {
  return Buffer.from(JSON.stringify(intent)).toString('base64url')
}

export function decodeIntent(token: string): ChargeIntent | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as ChargeIntent
    if (typeof parsed.ref !== 'string' || typeof parsed.issuedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

// --- High-level operations --------------------------------------------------

/**
 * Build a SNAP-style partner reference. Real QRIS payloads are EMVCo strings;
 * in mock mode we emit a recognizable placeholder so the QR renders and scans
 * as plain text (clearly marked as a simulation, never a real payable code).
 */
export async function createCharge(orderId: string, amount: number): Promise<ChargeResult> {
  const issuedAt = Date.now()
  const referenceNo = `WSTR-${orderId}-${randomUUID().slice(0, 8)}`
  const expiresAt = new Date(issuedAt + EXPIRES_MS).toISOString()

  const config = getConfig()
  if (!config) {
    // MOCK: deterministic placeholder QR string.
    const qrString = `ASTRAPAY-MOCK|ref=${referenceNo}|amount=${amount}|cur=IDR`
    return {
      referenceNo,
      qrString,
      amount,
      expiresAt,
      status: 'PENDING',
      intent: encodeIntent({ ref: referenceNo, amount, issuedAt }),
    }
  }

  // LIVE: get token, sign, POST /v1.0/qr/qr-mpm-generate, return real qrContent.
  const qrContent = await generateLiveQris(config, referenceNo, amount)
  return {
    referenceNo,
    qrString: qrContent,
    amount,
    expiresAt,
    status: 'PENDING',
    intent: encodeIntent({ ref: referenceNo, amount, issuedAt }),
  }
}

export async function queryStatus(intent: ChargeIntent): Promise<PaymentStatus> {
  const elapsed = Date.now() - intent.issuedAt
  if (elapsed > EXPIRES_MS) return 'EXPIRED'

  if (isMockMode()) {
    // Simulate the user scanning + paying after a short delay.
    return elapsed >= MOCK_PAY_DELAY_MS ? 'PAID' : 'PENDING'
  }

  // LIVE: POST /v1.0/qr/qr-mpm-query and map latestTransactionStatus.
  return queryLiveStatus(intent.ref)
}

// --- Live SNAP calls (exercised once credentials are configured) ------------

async function getAccessToken(config: AstraPayConfig): Promise<string> {
  const timestamp = new Date().toISOString()
  const signature = signAccessToken(config.clientKey, timestamp, config.privateKey)
  const res = await fetch(`${config.baseUrl}/v1.0/access-token/b2b`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CLIENT-KEY': config.clientKey,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
    },
    body: JSON.stringify({ grantType: 'client_credentials' }),
  })
  if (!res.ok) throw new Error(`AstraPay token failed: ${res.status}`)
  const json = (await res.json()) as { accessToken?: string }
  if (!json.accessToken) throw new Error('AstraPay token missing accessToken')
  return json.accessToken
}

async function generateLiveQris(
  config: AstraPayConfig,
  partnerReferenceNo: string,
  amount: number
): Promise<string> {
  const accessToken = await getAccessToken(config)
  const path = '/v1.0/qr/qr-mpm-generate'
  const timestamp = new Date().toISOString()
  const body = {
    partnerReferenceNo,
    amount: { value: amount.toFixed(2), currency: 'IDR' },
    merchantId: config.merchantId,
  }
  const signature = signTransaction({
    method: 'POST',
    path,
    accessToken,
    body,
    timestamp,
    clientSecret: config.clientSecret,
  })
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': config.clientKey,
      'X-EXTERNAL-ID': randomUUID(),
      'CHANNEL-ID': 'WSTR',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`AstraPay QRIS generate failed: ${res.status}`)
  const json = (await res.json()) as { qrContent?: string }
  if (!json.qrContent) throw new Error('AstraPay QRIS response missing qrContent')
  return json.qrContent
}

async function queryLiveStatus(referenceNo: string): Promise<PaymentStatus> {
  const config = getConfig()
  if (!config) return 'PENDING'
  const accessToken = await getAccessToken(config)
  const path = '/v1.0/qr/qr-mpm-query'
  const timestamp = new Date().toISOString()
  const body = { originalPartnerReferenceNo: referenceNo, serviceCode: '17' }
  const signature = signTransaction({
    method: 'POST',
    path,
    accessToken,
    body,
    timestamp,
    clientSecret: config.clientSecret,
  })
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': config.clientKey,
      'X-EXTERNAL-ID': randomUUID(),
      'CHANNEL-ID': 'WSTR',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return 'PENDING'
  const json = (await res.json()) as { latestTransactionStatus?: string }
  return mapSnapStatus(json.latestTransactionStatus)
}

/** SNAP latestTransactionStatus → our PaymentStatus. */
function mapSnapStatus(code: string | undefined): PaymentStatus {
  switch (code) {
    case '00':
      return 'PAID'
    case '03': // pending
    case '01': // initiated
      return 'PENDING'
    case '06': // failed
    case '07': // not found
      return 'FAILED'
    default:
      return 'PENDING'
  }
}
