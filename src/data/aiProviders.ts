// Single source of truth for AI providers — imported by both the admin UI
// (src/pages/AiAgent.tsx) and the API routes (api/ai-analysis.ts, api/ai-test.ts).
// All providers listed here MUST be OpenAI-compatible (POST /chat/completions
// with the standard messages payload). Anthropic / non-compatible providers
// would need a separate code path and are not included.

export interface AiProvider {
  id: string
  label: string
  /** Base URL — `/chat/completions` is appended at request time. */
  baseUrl: string
  /** Hint shown in the API key input. */
  keyPlaceholder: string
  /** Where to get the key. */
  keyHelpUrl: string
  /** Suggested models for this provider. The user picks one from here. */
  models: { id: string; label: string; description: string }[]
}

// NOTE: GitHub Models used to be the default provider here. It was fully
// retired on 2026-07-30 — the inference API now returns 410 Gone for every
// request regardless of token, so it is removed rather than left as a broken
// option. Existing DB rows pointing at 'github-models' fall back to Groq.
export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    keyHelpUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B', description: 'Google, cepat & ringan' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Cepat & murah' },
      { id: 'gpt-4o', label: 'GPT-4o', description: 'Flagship multimodal' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Generasi 4.1, ringan' },
      { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Kualitas tertinggi 4.1' },
      { id: 'o1-mini', label: 'o1-mini', description: 'Reasoning, lebih murah' },
      { id: 'o1', label: 'o1', description: 'Reasoning model penuh' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    keyHelpUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', description: 'Via OpenRouter' },
      { id: 'openai/gpt-4o', label: 'GPT-4o', description: 'Via OpenRouter' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', description: 'Anthropic via OR' },
      { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', description: 'Cepat & murah' },
      { id: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', description: 'Google via OR' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', description: 'Open weights' },
    ],
  },
]

export const DEFAULT_PROVIDER_ID = 'groq'

export function getProvider(id: string): AiProvider {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0]
}

export function getDefaultModel(providerId: string): string {
  return getProvider(providerId).models[0]?.id ?? 'gemma2-9b-it'
}

/** Returns `${baseUrl}/chat/completions` for a given provider id. */
export function chatCompletionsUrl(providerId: string): string {
  return `${getProvider(providerId).baseUrl}/chat/completions`
}
