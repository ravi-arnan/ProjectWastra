import type { VercelRequest, VercelResponse } from '@vercel/node'

// Inlined fallbacks. Kept in sync with src/data/aiDefaults.ts. These were
// previously imported from ../src/data/aiDefaults, but the cross-folder
// import made @vercel/node's bundler fail at module load with
// FUNCTION_INVOCATION_FAILED, so the file is now self-contained.
const BASE_SYSTEM_PROMPT = `Kamu adalah Wastra AI, asisten wisata cerdas untuk platform pariwisata Bali. Kamu membantu pengguna menemukan destinasi terbaik di seluruh Bali, memberikan informasi lengkap, rekomendasi waktu kunjungan, dan rencana perjalanan.

---

## KEPRIBADIAN & GAYA BAHASA

- Gunakan Bahasa Indonesia yang ramah, hangat, dan informatif
- Gunakan emoji secukupnya agar jawaban lebih menarik dan mudah dibaca
- Jawab secara terstruktur, ringkas, dan mudah dipahami
- Jadilah seperti teman perjalanan yang berpengetahuan luas tentang Bali

---

## CAKUPAN PENGETAHUAN

Kamu bebas menjawab pertanyaan tentang semua destinasi wisata di Bali, tidak terbatas pada daftar tertentu.`

const DEFAULT_FALLBACK_MESSAGE =
  'Maaf, saya tidak bisa memberikan respons saat ini. Coba tanyakan lagi dengan kata lain ya.'

const DEFAULT_REFUSAL_MESSAGE =
  'Maaf, saya tidak bisa membantu dengan topik itu. Tanyakan seputar wisata Bali ya.'

// Inlined provider → endpoint map. Kept in sync with src/data/aiProviders.ts.
const PROVIDER_BASE_URLS: Record<string, string> = {
  'github-models': 'https://models.inference.ai.azure.com',
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
}
const DEFAULT_PROVIDER_ID = 'github-models'
function chatCompletionsUrl(providerId: string): string {
  const base = PROVIDER_BASE_URLS[providerId] ?? PROVIDER_BASE_URLS[DEFAULT_PROVIDER_ID]
  return `${base}/chat/completions`
}

// Destinations catalog. Mirror of src/data/destinations.ts (full list, no
// images/lat/lng since the LLM doesn't need those). Update both when destinations
// change. Cross-folder import from src/ breaks @vercel/node bundling so this is
// intentionally inlined.
interface DestinationRow {
  name: string
  region: string
  category: string
  density: number
  densityLabel: string
  visitors: number
  maxCapacity: number
  rating: number
  openHours: string
  ticketPrice: string
  description: string
}
const destinations: DestinationRow[] = [
  { name: 'Tanah Lot',                region: 'Tabanan, Bali',       category: 'Pura',         density: 0.87, densityLabel: 'Sangat Ramai', visitors: 1248, maxCapacity: 1500, rating: 4.5, openHours: '06.00 - 19.00', ticketPrice: 'Rp 60.000', description: 'Situs budaya & keindahan pesisir, terkenal untuk sunset dramatis' },
  { name: 'Uluwatu',                  region: 'Pecatu, Badung',      category: 'Pura',         density: 0.85, densityLabel: 'Sangat Ramai', visitors: 4821, maxCapacity: 5500, rating: 4.7, openHours: '07.00 - 19.00', ticketPrice: 'Rp 50.000', description: 'Pura luhur di tebing 70m, tari Kecak setiap senja' },
  { name: 'Kuta Beach',               region: 'Kuta, Badung',        category: 'Pantai',       density: 0.95, densityLabel: 'Sangat Ramai', visitors: 6200, maxCapacity: 7000, rating: 4.2, openHours: '24 Jam',         ticketPrice: 'Gratis',    description: 'Pantai ikonik untuk surfing pemula dan sunset' },
  { name: 'Bedugul',                  region: 'Tabanan, Bali',       category: 'Alam',         density: 0.22, densityLabel: 'Sepi',         visitors: 420,  maxCapacity: 2000, rating: 4.8, openHours: '07.00 - 18.00', ticketPrice: 'Rp 75.000', description: 'Danau Beratan & pura di pegunungan, suhu 18-24°C' },
  { name: 'Sanur Beach',              region: 'Denpasar, Bali',      category: 'Pantai',       density: 0.29, densityLabel: 'Sepi',         visitors: 580,  maxCapacity: 2000, rating: 4.6, openHours: '24 Jam',         ticketPrice: 'Gratis',    description: 'Pantai tenang, ideal untuk sunrise dan keluarga' },
  { name: 'Ubud Monkey Forest',       region: 'Ubud, Gianyar',       category: 'Alam',         density: 0.45, densityLabel: 'Sedang',       visitors: 1205, maxCapacity: 2800, rating: 4.5, openHours: '08.30 - 18.00', ticketPrice: 'Rp 80.000', description: 'Hutan sakral dengan ratusan monyet ekor panjang' },
  { name: 'Tegalalang Rice Terrace',  region: 'Ubud, Gianyar',       category: 'Alam',         density: 0.62, densityLabel: 'Ramai',        visitors: 1890, maxCapacity: 3000, rating: 4.6, openHours: '07.00 - 18.00', ticketPrice: 'Rp 25.000', description: 'Sawah terasering ikonik, foto terbaik pagi hari' },
  { name: 'Pantai Pandawa',           region: 'Kutuh, Badung',       category: 'Pantai',       density: 0.20, densityLabel: 'Sepi',         visitors: 840,  maxCapacity: 4000, rating: 4.4, openHours: '07.00 - 18.00', ticketPrice: 'Rp 20.000', description: 'Pantai tersembunyi di balik tebing kapur, air jernih' },
  { name: 'Pura Besakih',             region: 'Karangasem, Bali',    category: 'Pura',         density: 0.65, densityLabel: 'Ramai',        visitors: 2150, maxCapacity: 3500, rating: 4.7, openHours: '08.00 - 18.00', ticketPrice: 'Rp 60.000', description: 'Pura terbesar & terpenting di Bali, di kaki Gunung Agung' },
  { name: 'Kintamani',                region: 'Bangli, Bali',        category: 'Alam',         density: 0.35, densityLabel: 'Sepi',         visitors: 950,  maxCapacity: 3000, rating: 4.6, openHours: '08.00 - 17.00', ticketPrice: 'Rp 30.000', description: 'Pemandangan Gunung Batur & Danau Batur, suhu 16-22°C' },
  { name: 'Desa Penglipuran',         region: 'Bangli, Bali',        category: 'Desa Wisata',  density: 0.38, densityLabel: 'Sedang',       visitors: 760,  maxCapacity: 2000, rating: 4.7, openHours: '08.00 - 17.00', ticketPrice: 'Rp 25.000', description: 'Desa adat Bali dengan arsitektur tradisional terjaga' },
  { name: 'Pantai Mengening',         region: 'Cemagi, Badung',      category: 'Pantai',       density: 0.18, densityLabel: 'Sepi',         visitors: 320,  maxCapacity: 1500, rating: 4.5, openHours: '24 Jam',         ticketPrice: 'Gratis',    description: 'Pantai tersembunyi di Cemagi, suasana tenang' },
]

// Build a "today" context block injected fresh on every request: live density,
// current month-driven season, weather hints by category, and external booking
// link templates the LLM is told to use.
function buildRuntimeContext(now: Date = new Date()): string {
  const MONTHS_DRY = [3, 4, 5, 6, 7, 8, 9] // Apr-Oct (0-indexed)
  const month = now.getUTCMonth()
  const isDrySeason = MONTHS_DRY.includes(month)
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const seasonBlock = isDrySeason
    ? 'Musim KEMARAU (Apr-Okt). Curah hujan rendah, langit cerah, ombak besar di pantai selatan. Pantai & sunset optimal. Suhu pesisir 26-32°C, dataran tinggi 18-24°C.'
    : 'Musim HUJAN (Nov-Mar). Hujan sore/malam, terutama Des-Feb. Pagi biasanya cerah - jadwalkan outdoor pagi hari. Suhu pesisir 25-30°C, dataran tinggi 16-22°C, sering berkabut.'

  // Per-category weather hints. Keep short, the LLM extrapolates.
  const weatherHintsByCategory: Record<string, string> = {
    'Pantai':       isDrySeason ? 'Cerah, ombak besar, sunset jelas; UV tinggi 10:00-14:00.' : 'Pagi cerah, hujan singkat siang/sore; ombak kuat & arus tidak menentu - hati-hati berenang.',
    'Pura':         isDrySeason ? 'Cuaca stabil, panas siang.' : 'Hujan sering siang/sore; bawa payung; pakaian sopan tetap wajib.',
    'Alam':         isDrySeason ? 'Trail kering, view jelas; sejuk pagi (Bedugul/Kintamani 16-20°C).' : 'Trail basah/licin, kabut tebal pagi & sore; peluang air terjun deras.',
    'Desa Wisata':  isDrySeason ? 'Cuaca nyaman sepanjang hari.' : 'Hujan singkat; tetap layak kunjungi karena teduh.',
  }

  const liveDensity = destinations
    .map((d) => {
      const pct = Math.round(d.density * 100)
      const cat = d.category
      const weather = weatherHintsByCategory[cat] ?? ''
      return `- ${d.name} (${d.region}, ${cat}): ${pct}% kapasitas (${d.densityLabel}), ${d.visitors}/${d.maxCapacity} pengunjung, rating ${d.rating}, jam ${d.openHours}, tiket ${d.ticketPrice}. ${d.description}.${weather ? ' Cuaca hari ini: ' + weather : ''}`
    })
    .join('\n')

  return `

---

## REAL-TIME CONTEXT (auto-injected, do not echo verbatim)

Today: ${dateStr}
Bali season: ${seasonBlock}

### Live density & info per destination
${liveDensity}

### How to use this context
- When user asks "where to go", "where is calm", or "what's busy" - use the percentages above.
- Recommend Sepi (<30%) destinations for calm, Sangat Ramai (>80%) only if specifically asked.
- For destinations NOT in the list, fall back to your general Bali knowledge but say so.
- Mention current season impact (e.g. "Tegalalang sedang sepi 20%, plus musim kemarau jadi sawah hijau cerah").
- Always cite the percentage when relevant ("kapasitas 65%", "ramai sekitar 60%").

### Booking - tetap di dalam aplikasi

Wastra punya alur booking sendiri. JANGAN merekomendasikan platform eksternal seperti Klook, GetYourGuide, Booking.com, Agoda, Traveloka, Tiket.com, TripAdvisor, dsb.

Saat user tertarik berkunjung / book sebuah destinasi:
- Arahkan ke halaman detail di aplikasi: tombol "Book Now" / "Book" di kartu destinasi atau di halaman detail.
- Sebut secara natural dalam jawaban, contoh: "Buka detail Tanah Lot di Wastra lalu klik 'Book Now' untuk pesan tiket masuk."
- Jangan menyertakan URL eksternal apapun untuk pemesanan.
`
}

const DEFAULT_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT

const DEFAULT_FALLBACK = DEFAULT_FALLBACK_MESSAGE
const DEFAULT_REFUSAL = DEFAULT_REFUSAL_MESSAGE

type Persona = 'informatif' | 'formal' | 'santai' | 'profesional'

const PERSONA_HINT: Record<Persona, string> = {
  informatif: '',
  formal: 'Gunakan bahasa formal dan sopan.',
  santai: 'Gunakan bahasa santai dan akrab, boleh pakai emoji.',
  profesional: 'Jawab dengan nada profesional, ringkas, dan data-driven.',
}

interface AiSettings {
  api_key: string | null
  api_provider: string
  default_model: string
  system_prompt: string | null
  max_tokens: number
  temperature: number
  persona: Persona
  content_filter_enabled: boolean
  blocked_keywords: string[]
  refusal_message: string
  fallback_message: string
  allow_anonymous_chat: boolean
}

const DEFAULT_SETTINGS: AiSettings = {
  api_key: null,
  api_provider: DEFAULT_PROVIDER_ID,
  default_model: 'gpt-4o-mini',
  system_prompt: null,
  max_tokens: 1024,
  temperature: 0.7,
  persona: 'informatif',
  content_filter_enabled: true,
  blocked_keywords: [],
  refusal_message: DEFAULT_REFUSAL,
  fallback_message: DEFAULT_FALLBACK,
  allow_anonymous_chat: true,
}

async function fetchAiSettings(): Promise<AiSettings> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  // Service role bypasses RLS so we can read api_key. Falls back to anon key
  // for local dev where the service role might not be configured (in which
  // case api_key reads will return empty and we use GITHUB_TOKEN env fallback).
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return DEFAULT_SETTINGS

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/ai_agent_settings?id=eq.1&select=api_key,api_provider,default_model,system_prompt,max_tokens,temperature,persona,content_filter_enabled,blocked_keywords,refusal_message,fallback_message,allow_anonymous_chat`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )
    if (!res.ok) return DEFAULT_SETTINGS
    const rows = (await res.json()) as Partial<AiSettings>[]
    const row = rows[0]
    if (!row) return DEFAULT_SETTINGS
    return {
      api_key: row.api_key ?? null,
      api_provider: row.api_provider || DEFAULT_SETTINGS.api_provider,
      default_model: row.default_model || DEFAULT_SETTINGS.default_model,
      system_prompt: row.system_prompt ?? null,
      max_tokens: row.max_tokens || DEFAULT_SETTINGS.max_tokens,
      temperature: row.temperature ?? DEFAULT_SETTINGS.temperature,
      persona: (row.persona as Persona) || DEFAULT_SETTINGS.persona,
      content_filter_enabled: row.content_filter_enabled ?? DEFAULT_SETTINGS.content_filter_enabled,
      blocked_keywords: row.blocked_keywords ?? DEFAULT_SETTINGS.blocked_keywords,
      refusal_message: row.refusal_message || DEFAULT_SETTINGS.refusal_message,
      fallback_message: row.fallback_message || DEFAULT_SETTINGS.fallback_message,
      allow_anonymous_chat: row.allow_anonymous_chat ?? DEFAULT_SETTINGS.allow_anonymous_chat,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

async function getUserFromToken(
  token: string | undefined
): Promise<{ is_anonymous?: boolean } | null> {
  if (!token) return null
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    return (await res.json()) as { is_anonymous?: boolean }
  } catch {
    return null
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isBlocked(message: string, keywords: string[]): boolean {
  if (keywords.length === 0) return false
  const lower = message.toLowerCase()
  return keywords.some((kw) => {
    const trimmed = kw.trim()
    if (!trimmed) return false
    const pattern = new RegExp(`\\b${escapeRegex(trimmed.toLowerCase())}\\b`)
    return pattern.test(lower)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { messages } = req.body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

  const trimmedMessages = messages.slice(-20)
  const settings = await fetchAiSettings()

  // API key resolution: DB value wins, env var as fallback for migration safety
  const apiKey = settings.api_key?.trim() || process.env.GITHUB_TOKEN
  if (!apiKey) {
    return res.status(503).json({ error: 'AI not configured. Set API key in /app/ai-agent.' })
  }

  // 1. Guest gate
  if (!settings.allow_anonymous_chat) {
    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const user = await getUserFromToken(accessToken)
    if (!user || user.is_anonymous) {
      return res.status(403).json({ error: settings.refusal_message })
    }
  }

  // 2. Content filter on latest user message
  if (settings.content_filter_enabled && settings.blocked_keywords.length > 0) {
    const lastUserMessage = [...trimmedMessages]
      .reverse()
      .find((m: { role: string }) => m.role === 'user')?.content ?? ''
    if (isBlocked(lastUserMessage, settings.blocked_keywords)) {
      return res.status(200).json({ reply: settings.refusal_message })
    }
  }

  // 3. Build system prompt: admin's stored prompt (or our default) + persona hint
  //    + a fresh runtime context block (live density per destination, current
  //    season, weather hints, external booking link rules).
  const baseSystem = settings.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT
  const personaHint = PERSONA_HINT[settings.persona] || ''
  const runtimeContext = buildRuntimeContext()
  const systemContent = [baseSystem, personaHint, runtimeContext]
    .filter((s) => s && s.trim())
    .join('\n\n')

  try {
    const response = await fetch(chatCompletionsUrl(settings.api_provider), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.default_model,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        messages: [
          { role: 'system', content: systemContent },
          ...trimmedMessages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${settings.api_provider} error:`, response.status, errorText)
      return res.status(502).json({ error: 'AI service temporarily unavailable' })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || settings.fallback_message

    return res.status(200).json({ reply })
    } catch (error) {
      console.error('AI analysis error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } catch (e) {
    // Last-resort guard so we never return raw FUNCTION_INVOCATION_FAILED.
    console.error('[ai-analysis] unhandled error:', e)
    return res.status(500).json({
      error: e instanceof Error ? `Handler error: ${e.message}` : 'Unknown handler error',
    })
  }
}
