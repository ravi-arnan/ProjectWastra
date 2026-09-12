# Wastra

Smart Tourism PWA for Indonesia: real-time crowd density tracking, AI crowd prediction, and smart recommendations across tourism destinations. Built for the AstraPay Hackathon 2026. Also ships as an Android app via Capacitor.

## Tech Stack

- React 19, TypeScript 6, Vite 8
- Tailwind CSS 4 (via @tailwindcss/vite)
- React Router 7, react-i18next (ID/EN), Leaflet + react-leaflet maps
- Supabase (auth + Postgres), @supabase/supabase-js
- Capacitor 8 (Android), vite-plugin-pwa (web installable PWA)
- motion, ogl (visual effects), react-markdown, qrcode, Cloudflare Turnstile
- Serverless API: Vercel functions in `api/` (AI analysis via Groq, AstraPay payments)
- Tests: Vitest (unit), Playwright (e2e)
- Package manager: npm (see package-lock.json)

## Commands

- `npm run dev` - runs Vite and the dev API server concurrently (see gotcha below)
- `npm run dev:vite` / `npm run dev:api` - run each half alone
- `npm run build` - `tsc -b` then `vite build`
- `npm run lint` - eslint
- `npm test` - vitest run (unit)
- `npm run test:watch` / `npm run test:coverage`
- `npm run test:e2e` - Playwright
- `npm run cap:sync` / `cap:open` / `cap:apk` / `cap:apk:release` / `cap:aab:release` - Android builds (set CAP_BUILD=true)
- No dedicated typecheck script; type errors surface through `npm run build`.

## Structure

- `src/pages/` - route pages (Home, Peta, Prediksi, Bandingkan, AiAgent, Otoritas, Admin, dashboard/)
- `src/components/` - UI components (layout, modals, admin/, reactbits/)
- `src/context/` - AuthContext
- `src/hooks/` - watchlist, bookings, notifications, a11y, reduced-motion
- `src/lib/` - core logic (supabase client, predictions, storage, platform, astrapay); most unit tests live here
- `src/data/` - destinations and AI provider/defaults data
- `src/i18n/` - i18next setup and locales
- `api/` - Vercel serverless functions (ai-analysis, ai-test, astrapay-*)
- `dev-api/server.ts` - local Express shim that maps `/api/:name` to `api/<name>.ts`
- `server/` - shared server-side helpers (astrapay, supabaseAdmin)
- `supabase/` - init_db.sql, seed.sql, migrations/
- `e2e/` - Playwright specs; `scripts/` - icon/media generation; `android/` - Capacitor project

## Conventions and Gotchas

- `npm run dev` starts Vite plus `tsx watch dev-api/server.ts`; Vite proxies `/api/*` to `http://localhost:3001` (vite.config.ts). The dev API loads `api/*.ts` handlers on demand to emulate Vercel functions locally.
- Native (Capacitor) builds set `CAP_BUILD=true`, which disables the PWA service worker (it can serve stale assets in the APK). Relative `/api` paths are rewritten to the deployed origin at runtime in `src/lib/platform.ts`.
- Env: client vars are `VITE_`-prefixed (Supabase URL/anon key, Turnstile site key). Server secrets (`AI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ASTRAPAY_*`) are never `VITE_`-prefixed. See `.env.example`.
- AstraPay payments run in mock mode when `ASTRAPAY_*` are unset (simulated QRIS auto-confirm); set all values to go live.
- Vitest coverage is intentionally scoped to pure logic in `src/lib` and a few hooks (vite.config.ts); side-effect modules are covered by the Playwright e2e suite instead.
- TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`, bundler module resolution, `verbatimModuleSyntax`).
- SPA routing on Vercel: all paths rewrite to `/index.html` (vercel.json).
