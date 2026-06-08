# Wastra — Performance Notes

A snapshot of the web bundle's performance posture, what is already optimized,
and the remaining backlog. Measured from `npm run build` (raw, pre-gzip sizes).

## Already optimized

The app ships a deliberately lean critical path:

- **Route-level code splitting** — every page is `lazy()`-loaded in `App.tsx`, so
  a visitor to `/` downloads only the Landing chunk, not the whole app.
- **Vendor splitting** — `react-vendor` and `i18n-vendor` are isolated into
  stable, long-cacheable chunks (`vite.config.ts` `manualChunks`).
- **Heavy libs are dynamic** — `leaflet` (maps), `ogl` (WebGL Aurora/Gallery),
  and the Supabase client load only on the routes that need them; Supabase is
  dynamically imported from `AuthContext`, so it is **not** on the initial path.
- **Fonts** — text fonts load non-render-blocking (`media="print"` + `onload`
  swap, `display=swap`); Material Symbols ships as a self-hosted **subset**
  (`/fonts/material-symbols-subset.woff2`) instead of the ~1.1 MB Google font.
- **Preconnects** — fonts and analytics origins are pre-warmed in `index.html`.
- **Images** — `vite-plugin-image-optimizer` + AVIF/WebP variants in the dataset.

## Initial critical path (route `/`)

`index.html` eagerly loads only: `react-vendor` (~225 KB), `i18n-vendor`
(~62 KB), the i18n locale bundle (~17 KB), and small shims (AuthContext, Logo,
PageLoader, platform). Landing + its animation deps load as a second wave.

## Largest chunks

| Chunk | Raw size | When loaded |
|-------|----------|-------------|
| `react-vendor` | ~225 KB | initial (unavoidable floor: React 19 + DOM + Router) |
| `supabase` | ~186 KB | on first auth/data call (dynamic, not initial) |
| `leaflet` | ~153 KB | map routes only |
| `AiAnalysis` | ~130 KB | AI route only (bundles `react-markdown`) |
| `motion` (`proxy-*`) | ~120 KB | first page using `motion` — includes Landing |

## Backlog (prioritized)

### 1. Trim `motion` on the landing path — biggest lever, needs visual QA
`Landing.tsx` imports `motion` synchronously, so the ~120 KB Framer Motion
runtime is part of the landing experience. The canonical fix is
[`LazyMotion` + the `m` component](https://motion.dev/docs/react-reduce-bundle-size),
which can cut the initial motion payload to ~15–30 KB.

**Caveat / why it is not done yet:** ~29 files use `motion.*` (~240 call sites),
and **2 components use layout animations** (`layoutId` in `SideNav.tsx` and
`dashboard/DashboardLayout.tsx`). Layout animations require the `domMax` feature
set (≈ the full bundle), so a blanket `domAnimation` migration would break them.
A correct migration must either drop those `layoutId` transitions or scope
feature sets — and the 240-site `motion.`→`m.` change needs visual regression
testing (Playwright screenshots at 320/768/1024/1440) before shipping.

### 2. Lazy-load the non-default locale — modest, low risk
`src/i18n/index.ts` bundles both `id` and `en` (~11 KB each) eagerly. Loading
`id` (the fallback) up front and dynamically importing `en` on language switch
saves ~11 KB raw. Mind the first-load case where the detector picks `en` from
storage/navigator (load it before render to avoid a fallback flash).

### 3. Share `react-markdown` — minor
`AiAnalysis` and `AiAgent` both pull `react-markdown` via `MarkdownMessage`.
It already sits behind their lazy route chunks; extracting a shared lazy
`MarkdownMessage` chunk would dedupe it across the two AI routes.

## How to re-measure

```bash
npm run build            # prints per-chunk sizes
# For Core Web Vitals (LCP/INP/CLS), run Lighthouse or the web-perf skill
# against the deployed site or `npm run preview`.
```
