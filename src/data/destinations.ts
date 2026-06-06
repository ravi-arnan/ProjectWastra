export interface Destination {
  id: string
  name: string
  location: string
  region: string
  category: string
  distance: string
  density: number
  densityLabel: 'Sangat Ramai' | 'Ramai' | 'Sedang' | 'Sepi'
  visitors: number
  maxCapacity: number
  rating: number
  reviewCount: number
  openHours: string
  ticketPrice: string
  parking: string
  lat: number
  lng: number
  image: string
  description: string
}

export const destinations: Destination[] = [
  {
    id: 'tanah-lot',
    name: 'Tanah Lot',
    location: 'Tabanan',
    region: 'Tabanan, Bali',
    category: 'Pura',
    distance: '18km',
    density: 0.87,
    densityLabel: 'Sangat Ramai',
    visitors: 1248,
    maxCapacity: 1500,
    rating: 4.5,
    reviewCount: 1284,
    openHours: '06.00 - 19.00',
    ticketPrice: 'Rp 60.000',
    parking: 'Tersedia (Penuh)',
    lat: -8.6212,
    lng: 115.0868,
    image: '/highcompress_TanahLot.jpg',
    description: 'Situs Budaya & Keindahan Pesisir',
  },
  {
    id: 'uluwatu',
    name: 'Uluwatu',
    location: 'Badung',
    region: 'Pecatu, Badung',
    category: 'Pura',
    distance: '22km',
    density: 0.85,
    densityLabel: 'Sangat Ramai',
    visitors: 4821,
    maxCapacity: 5500,
    rating: 4.7,
    reviewCount: 2156,
    openHours: '07.00 - 19.00',
    ticketPrice: 'Rp 50.000',
    parking: 'Tersedia',
    lat: -8.8291,
    lng: 115.0849,
    image: '/highcompress_Uluwatu.jpg',
    description: 'Pura Luhur dengan pemandangan tebing dramatis',
  },
  {
    id: 'kuta-beach',
    name: 'Kuta Beach',
    location: 'Badung',
    region: 'Kuta, Badung',
    category: 'Pantai',
    distance: '5km',
    density: 0.95,
    densityLabel: 'Sangat Ramai',
    visitors: 6200,
    maxCapacity: 7000,
    rating: 4.2,
    reviewCount: 3890,
    openHours: '24 Jam',
    ticketPrice: 'Gratis',
    parking: 'Berbayar',
    lat: -8.7176,
    lng: 115.1695,
    image: '/highcompress_KutaBeach.jpg',
    description: 'Pantai ikonik untuk surfing dan sunset',
  },
  {
    id: 'bedugul',
    name: 'Bedugul',
    location: 'Tabanan',
    region: 'Tabanan, Bali',
    category: 'Alam',
    distance: '45km',
    density: 0.22,
    densityLabel: 'Sepi',
    visitors: 420,
    maxCapacity: 2000,
    rating: 4.8,
    reviewCount: 980,
    openHours: '07.00 - 18.00',
    ticketPrice: 'Rp 75.000',
    parking: 'Luas',
    lat: -8.2835,
    lng: 115.1677,
    image: '/highcompress_Bedugul.jpg',
    description: 'Danau dan pura di pegunungan yang sejuk',
  },
  {
    id: 'sanur',
    name: 'Sanur Beach',
    location: 'Denpasar',
    region: 'Denpasar, Bali',
    category: 'Pantai',
    distance: '12km',
    density: 0.29,
    densityLabel: 'Sepi',
    visitors: 580,
    maxCapacity: 2000,
    rating: 4.6,
    reviewCount: 1540,
    openHours: '24 Jam',
    ticketPrice: 'Gratis',
    parking: 'Tersedia',
    lat: -8.6783,
    lng: 115.2631,
    image: '/highcompress_SanurBeach.jpg',
    description: 'Pantai tenang untuk sunrise dan budaya lokal',
  },
  {
    id: 'ubud-monkey-forest',
    name: 'Ubud Monkey Forest',
    location: 'Gianyar',
    region: 'Ubud, Gianyar',
    category: 'Alam',
    distance: '25km',
    density: 0.45,
    densityLabel: 'Sedang',
    visitors: 1205,
    maxCapacity: 2800,
    rating: 4.5,
    reviewCount: 4200,
    openHours: '08.30 - 18.00',
    ticketPrice: 'Rp 80.000',
    parking: 'Tersedia',
    lat: -8.5188,
    lng: 115.2585,
    image: '/highcompress_UbudMonkeyForest.jpg',
    description: 'Hutan sakral dengan ratusan monyet ekor panjang',
  },
  {
    id: 'tegalalang',
    name: 'Tegalalang Rice Terrace',
    location: 'Gianyar',
    region: 'Ubud, Gianyar',
    category: 'Alam',
    distance: '28km',
    density: 0.62,
    densityLabel: 'Ramai',
    visitors: 1890,
    maxCapacity: 3000,
    rating: 4.6,
    reviewCount: 2890,
    openHours: '07.00 - 18.00',
    ticketPrice: 'Rp 25.000',
    parking: 'Tersedia',
    lat: -8.4328,
    lng: 115.2789,
    image: '/highcompress_Tegalalang.jpg',
    description: 'Sawah terasering ikonik dengan pemandangan lembah',
  },
  {
    id: 'pandawa',
    name: 'Pantai Pandawa',
    location: 'Badung',
    region: 'Kutuh, Badung',
    category: 'Pantai',
    distance: '20km',
    density: 0.20,
    densityLabel: 'Sepi',
    visitors: 840,
    maxCapacity: 4000,
    rating: 4.4,
    reviewCount: 1250,
    openHours: '07.00 - 18.00',
    ticketPrice: 'Rp 20.000',
    parking: 'Luas',
    lat: -8.8451,
    lng: 115.1866,
    image: '/highcompress_PandawaBeach.jpg',
    description: 'Pantai tersembunyi di balik tebing kapur',
  },
  {
    id: 'besakih',
    name: 'Pura Besakih',
    location: 'Karangasem',
    region: 'Karangasem, Bali',
    category: 'Pura',
    distance: '60km',
    density: 0.65,
    densityLabel: 'Ramai',
    visitors: 2150,
    maxCapacity: 3500,
    rating: 4.7,
    reviewCount: 1870,
    openHours: '08.00 - 18.00',
    ticketPrice: 'Rp 60.000',
    parking: 'Tersedia',
    lat: -8.3734,
    lng: 115.4519,
    image: '/highcompress_Besakih.jpg',
    description: 'Pura terbesar dan terpenting di Bali',
  },
  {
    id: 'kintamani',
    name: 'Kintamani',
    location: 'Bangli',
    region: 'Bangli, Bali',
    category: 'Alam',
    distance: '50km',
    density: 0.35,
    densityLabel: 'Sepi',
    visitors: 950,
    maxCapacity: 3000,
    rating: 4.6,
    reviewCount: 1620,
    openHours: '08.00 - 17.00',
    ticketPrice: 'Rp 30.000',
    parking: 'Tersedia',
    lat: -8.2435,
    lng: 115.3341,
    image: '/highcompress_Kintamani.jpg',
    description: 'Pemandangan Gunung Batur dan Danau Batur',
  },
  {
    id: 'desa-penglipuran',
    name: 'Desa Penglipuran',
    location: 'Bangli',
    region: 'Bangli, Bali',
    category: 'Desa Wisata',
    distance: '45km',
    density: 0.38,
    densityLabel: 'Sedang',
    visitors: 760,
    maxCapacity: 2000,
    rating: 4.7,
    reviewCount: 1420,
    openHours: '08.00 - 17.00',
    ticketPrice: 'Rp 25.000',
    parking: 'Tersedia',
    lat: -8.4220,
    lng: 115.3581,
    image: '/highcompress_DesaPenglipuran.jpg',
    description: 'Desa adat Bali dengan arsitektur tradisional terjaga',
  },
  {
    id: 'pantai-mengening',
    name: 'Pantai Mengening',
    location: 'Badung',
    region: 'Cemagi, Badung',
    category: 'Pantai',
    distance: '28km',
    density: 0.18,
    densityLabel: 'Sepi',
    visitors: 320,
    maxCapacity: 1500,
    rating: 4.5,
    reviewCount: 540,
    openHours: '24 Jam',
    ticketPrice: 'Gratis',
    parking: 'Tersedia',
    lat: -8.6269,
    lng: 115.1276,
    image: '/highcompress_PantaiMengening.jpg',
    description: 'Pantai tersembunyi di Cemagi dengan suasana tenang',
  },
]

/** Default "calm" cutoff (0..1). A destination at or below this counts as quiet. */
export const DEFAULT_DENSITY_THRESHOLD = 0.3

/** Preset calm thresholds offered for watchlist density alerts. */
export const DENSITY_THRESHOLD_PRESETS = [
  { value: 0.3, labelId: 'Sepi', labelEn: 'Calm', hint: '< 30%' },
  { value: 0.6, labelId: 'Sedang', labelEn: 'Moderate', hint: '< 60%' },
  { value: 0, labelId: 'Mati', labelEn: 'Off', hint: '—' },
] as const

export function getDensityColor(density: number): string {
  if (density > 0.8) return 'error'
  if (density > 0.6) return 'tertiary'
  if (density > 0.3) return 'amber-500'
  return 'primary'
}

export function getDensityBgColor(density: number): string {
  if (density > 0.8) return 'bg-error'
  if (density > 0.6) return 'bg-tertiary'
  if (density > 0.3) return 'bg-amber-500'
  return 'bg-primary'
}

export function getDensityTextColor(density: number): string {
  if (density > 0.8) return 'text-error'
  if (density > 0.6) return 'text-tertiary'
  if (density > 0.3) return 'text-amber-600'
  return 'text-primary'
}
