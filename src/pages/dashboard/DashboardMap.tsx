import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'motion/react'
import { destinations } from '../../data/destinations'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'

function getDensityHex(density: number): string {
  if (density > 0.8) return '#ba1a1a' // Sangat Ramai (Merah)
  if (density > 0.6) return '#f97316' // Ramai (Orange)
  if (density > 0.3) return '#facc15' // Normal (Kuning)
  return '#10b981' // Sepi (Hijau)
}

function ZoomControls() {
  const map = useMap()
  return (
    <div className="absolute bottom-8 right-8 z-[400] hidden lg:flex flex-col gap-2">
      <button
        type="button"
        aria-label="Perbesar peta"
        onClick={() => map.zoomIn()}
        className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
      >
        <Icon name="add" />
      </button>
      <button
        type="button"
        aria-label="Perkecil peta"
        onClick={() => map.zoomOut()}
        className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
      >
        <Icon name="remove" />
      </button>
    </div>
  )
}

export default function DashboardMap() {
  const { isLocalManager, localManagerDestId } = useAuth()

  const allowedDestinations = useMemo(() => {
    return isLocalManager && localManagerDestId 
      ? destinations.filter(d => d.id === localManagerDestId)
      : destinations;
  }, [isLocalManager, localManagerDestId])

  const [activeCategory, setActiveCategory] = useState('Semua')
  const [activeRegion, setActiveRegion] = useState('Semua')
  const [minDensity, setMinDensity] = useState(0)

  const categories = ['Semua', ...Array.from(new Set(allowedDestinations.map((d) => d.category)))]
  const regions = ['Semua', ...Array.from(new Set(allowedDestinations.map((d) => d.region.split(',')[0].trim())))]

  const filteredDests = useMemo(() => {
    return allowedDestinations.filter((d) => {
      const matchCat = activeCategory === 'Semua' || d.category === activeCategory
      const matchReg = activeRegion === 'Semua' || d.region.includes(activeRegion)
      const matchDens = d.density * 100 >= minDensity
      return matchCat && matchReg && matchDens
    })
  }, [activeCategory, activeRegion, minDensity, allowedDestinations])

  const legendItems = [
    { label: 'Sepi / Tenang (<30%)', color: '#10b981' },
    { label: 'Cukup Ramai (30-60%)', color: '#facc15' },
    { label: 'Ramai (60-80%)', color: '#f97316' },
    { label: 'Sangat Ramai (>80%)', color: '#ba1a1a' },
  ]

  return (
    <div className="relative w-full h-full -mx-4 -mb-24 lg:-mx-8 lg:-my-6 w-[calc(100%+2rem)] lg:w-[calc(100%+4rem)] flex flex-col lg:flex-row">
      
      {/* ── Filter Sidebar (Kiri) ── */}
      <div className="w-full lg:w-[320px] bg-surface flex-shrink-0 border-r border-stone-100 p-5 flex flex-col gap-6 z-10 lg:h-[calc(100vh-64px)] overflow-y-auto hidden lg:flex">
        <div>
          <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
            <Icon name="map" size="20px" className="text-primary" />
            Peta Kepadatan
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            {isLocalManager ? 'Pantau posisi dan kepadatan pengunjung di area wisata Anda secara geografis.' : 'Visualisasi sebaran kepadatan destinasi wisata di Bali secara real-time.'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Region Filter */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Wilayah (Kabupaten)
            </label>
            <select
              value={activeRegion}
              onChange={(e) => setActiveRegion(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl text-sm font-semibold text-on-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {regions.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Kategori
            </label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl text-sm font-semibold text-on-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Density Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Kepadatan Minimal
              </label>
              <span className="text-xs font-bold text-primary">{minDensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minDensity}
              onChange={(e) => setMinDensity(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
              <span>Sepi (0%)</span>
              <span>Padat (100%)</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-stone-100">
          <button
            onClick={() => {
              setActiveCategory('Semua')
              setActiveRegion('Semua')
              setMinDensity(0)
            }}
            className="w-full py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="refresh" size="18px" />
            Reset Filter
          </button>
        </div>
      </div>

      {/* ── Map Container ── */}
      <div className="relative flex-1 h-[calc(100vh-56px-72px)] lg:h-[calc(100vh-64px)] z-0">
        <MapContainer
          center={[-8.4095, 115.1889]}
          zoom={10}
          zoomControl={false}
          className="w-full h-full"
          style={{ background: '#e2d8d2' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {filteredDests.map((dest) => {
            const hexColor = getDensityHex(dest.density)
            const radius = Math.max(12, dest.density * 35) // Proporsional dengan density
            
            return (
              <CircleMarker
                key={dest.id}
                center={[dest.lat, dest.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: hexColor,
                  fillOpacity: 0.6,
                  color: hexColor,
                  weight: 2,
                  opacity: 0.8,
                }}
              >
                <Popup className="dashboard-map-popup">
                  <div className="p-1 min-w-[200px]">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <h3 className="font-bold text-sm text-stone-800 font-headline leading-tight">{dest.name}</h3>
                    <p className="text-[10px] text-stone-500 mb-2">{dest.region} · {dest.category}</p>
                    
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-600">Kepadatan:</span>
                      <span className="text-xs font-bold" style={{ color: hexColor }}>
                        {Math.round(dest.density * 100)}%
                      </span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${dest.density * 100}%`, backgroundColor: hexColor }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Pengunjung:</span>
                      <span className="font-semibold">{dest.visitors.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
          
          <ZoomControls />
        </MapContainer>

        {/* ── Legend (Overlay pada peta) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60"
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon name="info" size="16px" className="text-on-surface-variant" />
            <span className="text-xs font-bold text-on-surface uppercase tracking-wide">
              Level Kepadatan
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-[11px] text-on-surface-variant font-semibold">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-4">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Total Ditampilkan</span>
            <span className="text-xs font-bold text-primary">{filteredDests.length} Destinasi</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
