import type { VercelRequest, VercelResponse } from '@vercel/node'

// Inlined provider → endpoint map. Kept in sync with src/data/aiProviders.ts.
// Inlined (not imported from ../src/) so the Vercel function bundle has no
// cross-folder dependency that could fail to resolve at build time.
// GitHub Models dropped here — retired 2026-07-30, endpoint returns 410 Gone.
const PROVIDER_ENDPOINTS: Record<string, { baseUrl: string; label: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', label: 'Groq' },
  openai: { baseUrl: 'https://api.openai.com/v1', label: 'OpenAI' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', label: 'OpenRouter' },
}

function resolveProvider(id: string): { baseUrl: string; label: string } {
  return PROVIDER_ENDPOINTS[id] ?? PROVIDER_ENDPOINTS.groq
}

async function isAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseAnonKey) return false

  let userId: string | null = null
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!userRes.ok) return false
    const data = (await userRes.json()) as { id?: string; is_anonymous?: boolean }
    if (data.is_anonymous || !data.id) return false
    userId = data.id
  } catch {
    return false
  }

  const lookupKey = supabaseServiceKey || supabaseAnonKey
  const lookupAuth = supabaseServiceKey ? supabaseServiceKey : token
  try {
    const adminRes = await fetch(
      `${supabaseUrl}/rest/v1/admins?user_id=eq.${userId}&select=user_id`,
      {
        headers: {
          apikey: lookupKey,
          Authorization: `Bearer ${lookupAuth}`,
        },
      }
    )
    if (!adminRes.ok) return false
    const rows = (await adminRes.json()) as { user_id: string }[]
    return rows.length > 0
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const admin = await isAdmin(accessToken)
    if (!admin) {
      return res.status(403).json({ ok: false, error: 'Admin only' })
    }

    const { apiKey, model, provider } = req.body ?? {}
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ ok: false, error: 'apiKey required' })
    }
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ ok: false, error: 'model required' })
    }

    const providerId = typeof provider === 'string' ? provider : 'groq'
    const { baseUrl, label } = resolveProvider(providerId)
    const endpoint = `${baseUrl}/chat/completions`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 8,
          messages: [
            { role: 'system', content: 'You reply with a single word.' },
            { role: 'user', content: 'ping' },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return res.status(200).json({
          ok: false,
          error: `${label} returned ${response.status}: ${errorText.slice(0, 200)}`,
        })
      }
      const data = await response.json()
      const reply = data.choices?.[0]?.message?.content
      return res.status(200).json({ ok: true, reply })
    } catch (e) {
      return res.status(200).json({
        ok: false,
        error: e instanceof Error ? e.message : 'Network error',
      })
    }
  } catch (e) {
    // Last-resort guard so we never return raw FUNCTION_INVOCATION_FAILED.
    console.error('[ai-test] unhandled error:', e)
    return res.status(200).json({
      ok: false,
      error: e instanceof Error ? `Handler error: ${e.message}` : 'Unknown handler error',
    })
  }
}
