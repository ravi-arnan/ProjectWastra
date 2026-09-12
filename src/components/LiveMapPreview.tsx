import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Density = 'calm' | 'moderate' | 'busy'

interface MapPin {
  name: string
  lat: number
  lng: number
  density: Density
  percent: number
}

const pins: MapPin[] = [
  { name: 'Tanah Lot', lat: -8.6212, lng: 115.0868, density: 'calm', percent: 15 },
  { name: 'Uluwatu', lat: -8.8291, lng: 115.0849, density: 'busy', percent: 88 },
  { name: 'Kuta Beach', lat: -8.7176, lng: 115.1695, density: 'busy', percent: 78 },
  { name: 'Sanur', lat: -8.6783, lng: 115.2631, density: 'moderate', percent: 54 },
  { name: 'Ubud', lat: -8.5188, lng: 115.2585, density: 'calm', percent: 28 },
  { name: 'Tegallalang', lat: -8.4328, lng: 115.2789, density: 'calm', percent: 12 },
  { name: 'Bedugul', lat: -8.2835, lng: 115.1677, density: 'moderate', percent: 47 },
  { name: 'Kintamani', lat: -8.2435, lng: 115.3341, density: 'calm', percent: 22 },
  { name: 'Besakih', lat: -8.3734, lng: 115.4519, density: 'moderate', percent: 41 },
]

const colorFor = (d: Density): string => {
  if (d === 'busy') return '#ba1a1a'
  if (d === 'moderate') return '#a36700'
  return '#00647c'
}

const labelFor = (d: Density): string => {
  if (d === 'busy') return 'BUSY'
  if (d === 'moderate') return 'MODERATE'
  return 'CALM'
}

const buildIcon = (d: Density): L.DivIcon => {
  const color = colorFor(d)
  const size = d === 'busy' ? 18 : d === 'moderate' ? 16 : 14
  const pulse =
    d === 'busy'
      ? `<span style="position:absolute;inset:-10px;border-radius:9999px;background:${color};opacity:0.25;animation:lmp-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite;"></span>`
      : ''
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <span style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);position:relative;z-index:1;"></span>
      </div>
    `,
  })
}

export default function LiveMapPreview() {
  return (
    <div className="absolute inset-0 isolate">
      <style>{`
        @keyframes lmp-pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(2.2); opacity: 0; }
        }
        .lmp-wrapper .leaflet-container {
          background: #e8f1f2;
          font-family: var(--font-body), 'Manrope', sans-serif;
        }
        .lmp-wrapper .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.7);
          font-size: 9px;
          padding: 1px 6px;
          border-radius: 6px 0 0 0;
        }
        .lmp-wrapper .leaflet-popup-content-wrapper {
          border-radius: 14px;
          padding: 4px 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .lmp-wrapper .leaflet-popup-content {
          margin: 6px 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>
      <div className="lmp-wrapper w-full h-full">
        <MapContainer
          center={[-8.45, 115.2]}
          zoom={10}
          minZoom={9}
          maxZoom={12}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={true}
          doubleClickZoom={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((pin) => (
            <Marker key={pin.name} position={[pin.lat, pin.lng]} icon={buildIcon(pin.density)}>
              <Popup>
                <div className="min-w-[140px]">
                  <p className="text-[12px] font-bold text-on-surface m-0 leading-tight">{pin.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: colorFor(pin.density) }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: colorFor(pin.density) }}
                    >
                      {labelFor(pin.density)} · {pin.percent}%
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
