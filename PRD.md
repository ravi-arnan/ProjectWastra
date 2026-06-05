# Wastra — Product Requirements Document

> **Status:** Living document · written retroactively after MVP build · v0.1
> **Last updated:** 2026-04-25
> **Built for:** Microsoft AI Impact Challenge 2026

---

## 1. Overview

**Wastra** is a Progressive Web App that surfaces real-time crowd density and AI-driven forecasts for tourist destinations across Bali. It helps travelers find the quietest moments at iconic spots and gives local authorities a window into visitor distribution patterns to support sustainable tourism.

The product is opinionated: **sustainability over volume, calm over peak, distribution over concentration.** Every recommendation is biased toward steering visitors away from overcrowded hotspots and toward equally beautiful but less-visited alternatives.

---

## 2. Problem statement

Bali receives 5–6 million international visitors per year, concentrated at a handful of icon destinations (Tanah Lot, Uluwatu, Tegallalang, Ubud Monkey Forest, Kuta). The result:

- **For travelers:** A "calm temple at sunrise" experience that brochures promise becomes a queue of 200 people fighting for the same Instagram angle.
- **For locals & authorities:** Infrastructure stress (parking, waste, water), erosion of cultural sites, displacement of community use of sacred places.
- **For lesser-known destinations:** Empty parking lots and underutilized tourism economy a 30-minute drive from saturated icons.

Existing tools (Google Maps "popular times", booking platforms) report *generic* crowd data with no Bali-specific context — no awareness of local ceremonies, weather impact on accessibility, or alternative spots within the same category.

---

## 3. Vision

A traveler opens Wastra in the morning, sees that Tegallalang is at 88% capacity, and accepts a one-tap recommendation for Jatiluwih (a quieter UNESCO-listed terrace 40 min away). They have a better trip, the icon site gets to breathe, and a smaller community gets visitor revenue.

Multiplied across 50,000 daily users, Wastra becomes a **distributed crowd-management tool** that benefits tourists and the island in the same gesture.

---

## 4. Goals & non-goals

### Goals (P0)
- Real-time density data for ≥200 Bali destinations, refreshed every 5 seconds.
- 7-day crowd forecasts with explainable factors (weather, holidays, ceremonies, flight data).
- AI assistant that answers natural-language travel questions grounded in current density data.
- Mobile-first PWA installable to home screen, usable offline for previously-viewed content.
- Bilingual UX (Bahasa Indonesia default, English secondary).

### Goals (P1)
- Mood-based recommendations ("Hidden Gems", "Quiet Morning", "Surf Report").
- Watchlist + push notifications when a saved destination drops below a calm threshold.
- Booking flow for select destinations (entrance tickets, time slots).
- Authority dashboard with aggregate visitor flows.

### Non-goals
- A general-purpose Bali travel guide (no hotel reviews, no flight booking, no rideshare integration).
- Coverage outside Bali (no Java, Lombok, or other Indonesian provinces — keep scope tight).
- Social features (no profiles to follow, no public reviews on Wastra itself; ratings come from existing sources).
- Replacing official tourism authority systems — Wastra is an additive layer, not a system of record.

---

## 5. Target users

### Persona A — "Anya, the conscious traveler"
- 28, from Jakarta or abroad, 5–7 days in Bali.
- Has done research on Reddit and Instagram; knows the icon spots but worries about over-tourism.
- Wants experiences that feel authentic, willing to drive 30 min for a less-crowded alternative.
- Uses the app on her phone, primarily before leaving the hotel (~7am) and during transit.

### Persona B — "Pak Made, the local authority officer"
- 45, works at a Bali regency tourism office.
- Needs aggregate visitor flow data for budgeting, staffing, and crowd-control planning.
- Currently relies on after-the-fact ticket counts and informal reports from on-site staff.
- Will use Wastra on a desktop, weekly cadence, primarily the prediction and historical views.

### Persona C — "Sari, the local guide"
- 32, freelance guide who creates day trips for 2–6 travelers.
- Wants to plan itineraries that avoid bottlenecks and give clients a quality experience.
- Uses the app to compare destinations side-by-side and pull up forecasts mid-trip.

---

## 6. Core user stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-1 | traveler | see live crowd levels for Bali destinations | I can avoid wasted trips to overcrowded spots |
| US-2 | traveler | get a 7-day forecast for a specific destination | I can plan my itinerary around quiet windows |
| US-3 | traveler | ask an AI assistant for personalized recommendations | I don't have to read a dozen blog posts |
| US-4 | traveler | save destinations to a watchlist | I get notified when crowds drop |
| US-5 | traveler | switch between Indonesian and English | the app feels native to me |
| US-6 | guest user | use the app without creating an account | I can evaluate it before committing |
| US-7 | authority | view aggregate trends across regencies | I can make informed planning decisions |
| US-8 | guide | compare two destinations on density and forecast | I can choose the better option for my client |
| US-9 | traveler | install Wastra to my home screen | it feels like a native app |
| US-10 | traveler | use the app offline for previously-viewed destinations | I can reference info without data |

---

## 7. Feature inventory

### Built (MVP — shipped)
- Landing page with motion polish (Reactbits components, Aurora shaders, animated bento grid).
- Auth: email/password + anonymous guest + Cloudflare Turnstile captcha. Glassmorphism over a video background.
- Home dashboard: greeting, category chips, popular destinations carousel, mood-filtered recommendations.
- Peta (Map): Leaflet + CartoDB Voyager tiles, density markers with pulsing for high-crowd, legend, detail card/bottom sheet.
- Prediksi (Forecasts): destination selector, 7-day bar chart, hourly breakdown, factor cards (weather/event/trend), AI summary banner, downloadable text report.
- Profil: avatar, stats, watchlist, booking history, settings modals (language, notifications, privacy/security, appearance, help, about).
- AI Analysis: chat assistant with markdown-rendered responses + emoji-to-icon mapping, suggested prompts, destination-status sidebar.
- Admin panel: AI prompt + safeguard configuration, runtime settings management.
- Bilingual UI (Bahasa Indonesia + English) via react-i18next, language toggle in Profil.
- PWA: installable, offline-ready service worker, custom manifest.
- Booking flow: per-destination time slots, ticket codes, cancellation.

### Planned (next iteration — P1)
- Push notifications when a watchlisted destination drops below a user-set density threshold.
- Side-by-side destination comparison view.
- Authority/regency dashboard with aggregate flow charts.
- Live cam embeds for select destinations (currently a placeholder button).
- Real ML-driven crowd forecasting backend (current forecasts use a deterministic heuristic in `src/lib/predictions.ts`).
- Real density ingestion pipeline (currently destination data is static in `src/data/destinations.ts`).

### Future / exploratory (P2)
- Apple/Google Wallet pass for booked tickets.
- Integration with Bali tourism authority for official ticket validation.
- Expansion to 500+ destinations covering villages and lesser-known beaches.
- Multi-language beyond id/en (Mandarin, Japanese, Korean — top inbound visitor languages).
- Seasonal "ceremony calendar" with auto-recommendations for cultural visitors.
- Carbon-aware routing suggestions (electric scooter rentals, walking-distance grouping).

---

## 8. Success metrics

### Product KPIs
- **Activation:** % of new users who view ≥3 destinations in their first session. Target: 60%.
- **Retention:** D7 retention for non-anonymous users. Target: 25%.
- **Behavior change (north star):** % of recommendation taps that lead to a booking or watchlist add. Target: 15%.
- **Distribution effect:** weekly avg density at top-5 vs middle-tier (#10–30) destinations. Goal: shrink the gap.

### Technical KPIs
- p95 first contentful paint on 4G: < 2 sec.
- AI assistant p95 response time: < 6 sec.
- PWA install rate (eligible browsers): > 8%.
- Lighthouse PWA / Performance / Accessibility: all > 90.

### Business / impact KPIs
- Active users in peak Bali season (Jul–Aug): 50,000+ MAU.
- Authority partnerships: at least 1 regency tourism office actively using the dashboard.
- Press / awards: featured in Microsoft AI Impact Challenge 2026 final round.

---

## 9. Architecture summary

(Detailed setup lives in [README.md](./README.md). This section is the "what" not the "how".)

- **Frontend:** React 19 + Vite 8 + TypeScript, Tailwind 4 with a hand-rolled Material Design 3 token palette in `src/index.css`.
- **State:** Local React state + URL params for routing; no global store. `localStorage` for mood + language + avatar persistence.
- **Auth:** Supabase Auth (email/password + anonymous), Cloudflare Turnstile captcha gate.
- **Database:** Supabase Postgres for `ai_agent_settings`, admin role, future ingestion tables. Destinations are currently static in `src/data/destinations.ts`.
- **AI:** GitHub Models backend via `/api/ai-analysis` endpoint (was Anthropic — migrated for cost). Prompt + safeguards configured via admin panel, persisted in Supabase.
- **Maps:** Leaflet + react-leaflet, CartoDB Voyager basemap (no API key, attribution preserved).
- **Animation:** `motion` (formerly framer-motion), `gsap` (for ScrollReveal/DotGrid), `ogl` (WebGL for Aurora/CircularGallery).
- **Internationalization:** `react-i18next` with `id.json` + `en.json` resource files, browser language detection, localStorage persistence.
- **Deployment:** Vercel for frontend + serverless API. Originals (uncompressed video sources) gitignored to `public/originals/`.

---

## 10. Constraints & principles

### Constraints
- **Network:** Many Bali users are on 3G/4G with intermittent connectivity. Page weight matters; avoid blocking JS bundles.
- **Devices:** Mobile-first. Mid-range Android (4 GB RAM, last-gen GPU) is the perf baseline. Heavy WebGL effects must degrade gracefully.
- **API budget:** AI Analysis calls cost real money. Cache aggressively, rate-limit anonymous users (currently gated via Turnstile).
- **Brand:** Stays close to Material Design 3 palette + Plus Jakarta Sans / Manrope. New colors require updating `index.css` tokens, not ad-hoc Tailwind hex values.

### Principles
1. **Calm over peak.** When the recommendation engine is uncertain, bias toward less-crowded options.
2. **Local first.** Default copy in Bahasa Indonesia. Indonesian Rupiah for currency. Asia/Makassar timezone.
3. **Lightweight by default.** Reach for plain `<img>` over libraries. Reach for Tailwind utilities over component frameworks. Add a dependency only when you're solving a real problem.
4. **Motion serves story.** Animations exist to communicate state (entering, loading, focus) — never as decoration that delays interaction.
5. **Truthful uncertainty.** AI responses should acknowledge when they don't know. Forecasts should show a confidence indicator (planned).

---

## 11. Out-of-scope (explicit non-features)

- User-to-user messaging or social profiles.
- Hotel, flight, restaurant, or rideshare booking.
- Cryptocurrency, NFTs, "Web3" anything.
- Native iOS/Android apps (PWA covers it).
- Coverage outside Bali.
- Telling users where to go for political/religious reasons (we describe, we don't prescribe).
- Replacing the user's judgment about safety (tide warnings, monkey aggression, scam alerts) — defer to official sources.

---

## 12. Open questions

- **Density ingestion:** Where does real ground-truth crowd data come from in production? Options: ticket counter feeds, IoT sensors at parking lots, anonymized cellular data partnerships, computer vision on public webcams. Pick one and pilot.
- **Authority partnership model:** Is the dashboard a free public good, a SaaS to regencies, or a research tool? Affects what we build next.
- **Monetization (or not):** Project is grant/challenge-funded today. Sustainable path could be: (a) free for travelers, paid for authorities; (b) freemium on advanced AI; (c) commission on bookings. Decide before building paywalls.
- **Forecast confidence:** When the heuristic is replaced with ML, how do we surface uncertainty without overwhelming users?
- **Offline coverage scope:** Today PWA caches static shell. Should it also cache the user's watchlist + last-known density data?

---

## 13. Glossary

| Term | Meaning |
|---|---|
| Density | Visitors / capacity at a destination, expressed 0.0–1.0 (0–100%). |
| Sangat Ramai / Very Busy | Density > 0.8. |
| Ramai / Busy | Density 0.6–0.8. |
| Sedang / Moderate | Density 0.3–0.6. |
| Sepi / Calm | Density < 0.3. |
| Hidden Gem | Density < 0.25 *and* rating ≥ 4.0 *and* review count ≥ 50. |
| Mood | A user-selectable filter (Hidden Gems, Quiet Morning, Surf Report, etc.) that re-scores recommendations. |
| Watchlist | A user's saved set of destinations they want notifications for. |

---

## 14. Document conventions

- Sections labeled "P0" are required for the next ship; "P1" is the immediate next iteration; "P2" is exploratory.
- Persona names are illustrative, not literal users.
- This PRD is intentionally short. When a section grows past two screens of scrolling, split it into a linked sub-doc.
