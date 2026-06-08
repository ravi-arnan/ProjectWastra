# Wastra — Tech Stack

**Wastra** is a smart tourism platform for Bali: a React SPA served on the web,
packaged as an Android APK with Capacitor, backed by Supabase and Vercel
serverless functions, with an LLM-powered travel assistant ("Wastra AI").

There is a **single UI codebase** — the web build (`dist/`) is what runs in the
browser *and* inside the Android WebView. See [ANDROID.md](./ANDROID.md) for the
native packaging details.

---

## Frontend

| Concern | Technology | Notes |
|---------|------------|-------|
| Language | **TypeScript 6** | `"type": "module"` (ESM throughout) |
| Framework | **React 19** | `react` / `react-dom` 19 |
| Build tool | **Vite 8** | `@vitejs/plugin-react`, image optimizer |
| Styling | **Tailwind CSS 4** | via `@tailwindcss/vite` |
| Routing | **React Router DOM 7** | SPA; Vercel rewrites all paths to `index.html` |
| Auth/data client | **`@supabase/supabase-js` 2** | browser SDK |
| i18n | **i18next + react-i18next** | ID/EN, default Indonesian; browser language detector |
| Maps | **Leaflet + react-leaflet** | crowd / destination map tiles |
| Animation | **GSAP 3** (`@gsap/react`), **Motion 12** (`motion`, `@motionone/react`), **OGL** | scroll + WebGL effects |
| Misc | `react-markdown`, `qrcode`, `@marsidev/react-turnstile` | AI chat rendering, QRIS rendering, anti-bot |

---

## Mobile (Android APK)

| Concern | Technology | Notes |
|---------|------------|-------|
| Wrapper | **Capacitor 8** | appId `com.wastra.app`, wraps `dist/` in a native WebView |
| Plugins | `@capacitor/app`, `browser`, `splash-screen`, `status-bar`, **CapacitorHttp** | deep links, OAuth browser, splash, status bar, CORS-free HTTP |
| Icons/assets | `@capacitor/assets` + `sharp` | adaptive icons generated from the logo |
| Native API target | Vercel production (`https://project-wastra.vercel.app`) | APK calls the deployed API routes & OAuth callbacks |

Build scripts (`package.json`) set `CAP_BUILD=true` to exclude the PWA service
worker from native builds: `cap:sync`, `cap:apk`, `cap:apk:release`,
`cap:aab:release`.

---

## Backend

| Concern | Technology | Notes |
|---------|------------|-------|
| Runtime | **Vercel Serverless Functions** (`@vercel/node` 5, ESM) | Node ≥ 22 |
| API routes | `api/ai-analysis`, `api/ai-test`, `api/astrapay-charge`, `api/astrapay-status`, `api/astrapay-notify` | |
| Shared server libs | `server/astrapay.ts`, `server/supabaseAdmin.ts` | server-only helpers (service-role key) |
| Database & Auth | **Supabase** (Postgres + Auth) | email/password, anonymous/guest, Google OAuth (PKCE); roles: `admins`, `local_managers` |
| Payments | **AstraPay SNAP** (QRIS) | mock mode when no credentials are configured |
| Local dev API | **Express 5** + `tsx` | `dev-api/server.ts` dynamically imports `api/*.ts` per request |

> ⚠️ Because the project is ESM, relative imports in `api/` **must** carry explicit
> `.js` extensions (e.g. `import '../server/astrapay.js'`). `tsx` tolerates
> extensionless imports locally, but Vercel's Node ESM resolver does not — a
> missing extension caused a runtime `ERR_MODULE_NOT_FOUND` (500) in production.

---

## AI / ML

No self-hosted model. Wastra AI calls hosted LLMs through an **OpenAI-compatible
`POST /chat/completions`** interface, so multiple providers share one code path.
Provider and model are selectable from the admin panel.

| Provider | Example models |
|----------|----------------|
| **GitHub Models** (default) | `gpt-4o-mini`, `gpt-4o`, `o1-mini`, Llama 3.1 8B, Mistral Nemo, Phi-3.5 Mini |
| **OpenAI** | GPT-4o / 4o-mini, GPT-4.1 / 4.1-mini, o1 / o1-mini |
| **OpenRouter** | GPT-4o, Claude 3.5 Sonnet, etc. (via OpenRouter) |
| **Groq** | OpenAI-compatible endpoint |

- Single source of truth: `src/data/aiProviders.ts` (admin UI) — provider map is
  **inlined** in `api/ai-analysis.ts` / `api/ai-test.ts` because cross-folder
  imports from `src/` break the `@vercel/node` bundler.
- System prompt (`BASE_SYSTEM_PROMPT`) is an Indonesian-language Bali travel guide
  persona; defaults live in `src/data/aiDefaults.ts`.
- Features: conversational assistant + destination analysis (`AiAgent.tsx`,
  `AiAnalysis.tsx`).

---

## Infrastructure & Tooling

| Concern | Technology |
|---------|------------|
| Hosting | **Vercel** (`project-wastra.vercel.app`) |
| CI/CD | GitHub PRs → Vercel preview/prod auto-deploy; GitHub Copilot reviews |
| E2E testing | **Playwright** |
| Lint | ESLint 9 + `typescript-eslint`, React hooks/refresh plugins |
| Image pipeline | `vite-plugin-image-optimizer`, `sharp`, `svgo` |

---

## At a Glance

```
                    ┌─────────────────────────────┐
   Web browser ─────▶                             │
                    │   React 19 + Vite (dist/)    │
   Android WebView ─▶   Tailwind · Router · i18n   │
   (Capacitor 8)    └──────────────┬──────────────┘
                                   │ HTTPS
                    ┌──────────────▼──────────────┐
                    │   Vercel Serverless (ESM)    │
                    │   api/ai-*  ·  api/astrapay-* │
                    └───┬───────────┬───────────┬──┘
                        │           │           │
                  ┌─────▼────┐ ┌────▼─────┐ ┌───▼────────────┐
                  │ Supabase │ │ AstraPay │ │ LLM provider   │
                  │ Pg+Auth  │ │  (QRIS)  │ │ (OpenAI-compat)│
                  └──────────┘ └──────────┘ └────────────────┘
```
