# Wastra

**Cerdas Memantau Keramaian Wisata di Pulau Dewata.**

Wastra is a Progressive Web App (PWA) that helps travelers and local authorities monitor real-time crowd density at tourist destinations across Bali. By providing live occupancy data, AI-driven predictions, and smart recommendations, it promotes sustainable tourism and helps visitors avoid overcrowded hotspots.

> Built for the Microsoft AI Impact Challenge 2026.

---

## Features

- **Real-time Density Tracking** — Live crowd levels at 10+ destinations with color-coded status (Sepi, Sedang, Ramai, Sangat Ramai)
- **Interactive Map** — Leaflet-powered map of Bali with pulsing density markers, search, and destination bottom sheets
- **AI Prediction Analysis** — 7-day crowd forecasts with hourly breakdowns and prediction factor cards (weather, events, social trends, holidays)
- **Smart Recommendations** — Personalized quieter alternatives based on location and current density
- **Destination Details** — Per-destination pages with crowd gauges, weather, zone analytics, ratings, and ticket booking
- **Watchlist** — Save favorite destinations and track their crowd levels
- **PWA Support** — Installable on mobile home screens with offline-ready service worker
- **Responsive Design** — Fully adaptive mobile-first UI with dedicated desktop layouts (sidebar navigation, bento grids)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [React 19](https://react.dev) + [TypeScript 6](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vite.dev) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) with Material Design 3 color tokens |
| **Routing** | [React Router 7](https://reactrouter.com) |
| **Maps** | [Leaflet](https://leafletjs.com) + [React Leaflet](https://react-leaflet.js.org) |
| **Backend** | [Supabase](https://supabase.com) (auth, database, real-time) |
| **PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (service worker, web manifest) |
| **Icons** | [Google Material Symbols Outlined](https://fonts.google.com/icons) |
| **Fonts** | Plus Jakarta Sans (headings) + Manrope (body) |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page — hero, feature bento grid, live map preview, CTA |
| `/app` | Home | Dashboard — greeting, search, category filters, popular destinations, recommendations |
| `/app/peta` | Peta (Map) | Interactive Leaflet map with density markers, legend, detail bottom sheet |
| `/app/destinasi/:id` | Detail | Destination page — hero, crowd gauge, weather, zone analytics, rating, booking, alternatives |
| `/app/prediksi` | Prediksi | Forecasting — watchlist, 7-day chart, hourly breakdown, prediction factors |
| `/app/profil` | Profil | Profile — user info, stats, settings, account management |

---

## Project Structure

```
ProjectWastra/
├── public/
│   ├── favicon.svg
│   └── icons/                  # PWA icons
├── src/
│   ├── components/
│   │   ├── AppLayout.tsx       # Main layout (sidebar + bottom nav + outlet)
│   │   ├── BottomNav.tsx       # Mobile bottom navigation bar
│   │   ├── SideNav.tsx         # Desktop sidebar navigation
│   │   ├── MobileHeader.tsx    # Mobile top header with location
│   │   └── Icon.tsx            # Material Symbols icon wrapper
│   ├── data/
│   │   └── destinations.ts     # Destination data + density helpers
│   ├── lib/
│   │   └── supabase.ts         # Supabase client initialization
│   ├── pages/
│   │   ├── Landing.tsx         # Marketing landing page
│   │   ├── Home.tsx            # App home dashboard
│   │   ├── Peta.tsx            # Interactive map page
│   │   ├── DestinationDetail.tsx # Destination detail page
│   │   ├── Prediksi.tsx        # Prediction/forecast page
│   │   └── Profil.tsx          # User profile page
│   ├── App.tsx                 # Router configuration
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind + theme tokens + animations
├── .env.example                # Environment variable template
├── vite.config.ts              # Vite + Tailwind + PWA config
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone https://github.com/ravi-arnan/ProjectWastra.git
cd ProjectWastra
npm install
```

### Configuration

Copy the env template and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
npm run preview   # Preview production build locally
```

---

## Design System

The app uses a **Material Design 3** inspired color system with custom Bali-themed tokens:

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#00647c` | Main actions, active states |
| `primary-container` | `#007f9d` | Elevated primary surfaces |
| `tertiary` | `#825100` | Warning/moderate density |
| `error` | `#ba1a1a` | High density, alerts |
| `surface` | `#fff8f5` | Page backgrounds |
| `on-surface` | `#1f1b17` | Primary text |

Density levels are color-coded:
- **Sepi** (< 30%) — `primary` (teal)
- **Sedang** (30–60%) — `amber`
- **Ramai** (60–80%) — `tertiary` (orange)
- **Sangat Ramai** (> 80%) — `error` (red)

---

## License

This project was built for the Microsoft AI Impact Challenge 2026. All rights reserved.
