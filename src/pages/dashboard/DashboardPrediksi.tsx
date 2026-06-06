import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { destinations } from '../../data/destinations'
import { generateWeeklyPrediction, generateHourlyPrediction } from '../../lib/predictions'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'


// Utility function to get hex color for the heatmap cells
function getDensityHex(density: number): string {
  if (density > 0.8) return '#ba1a1a'
  if (density > 0.6) return '#f97316'
  if (density > 0.3) return '#facc15'
  return '#10b981'
}

export default function DashboardPrediksi() {
  const { isLocalManager, localManagerDestId } = useAuth()
  
  const allowedDestinations = useMemo(() => {
    return isLocalManager && localManagerDestId 
      ? destinations.filter(d => d.id === localManagerDestId)
      : destinations;
  }, [isLocalManager, localManagerDestId])

  const [selectedDestId, setSelectedDestId] = useState<string | null>(null)

  // Pre-calculate weekly predictions for all destinations
  const weeklyData = useMemo(() => {
    return allowedDestinations.map(dest => {
      const preds = generateWeeklyPrediction(dest)
      return {
        dest,
        preds,
      }
    })
  }, [allowedDestinations])

  // Days from the first destination's predictions (since dates are same for all)
  const days = weeklyData[0]?.preds.map(p => ({
    day: p.day,
    dayShort: p.dayShort,
    date: p.date,
  })) || []

  // Calculate daily aggregates
  const dailyAggregates = useMemo(() => {
    return days.map((dayInfo, colIdx) => {
      let totalDensity = 0
      let maxDensity = -1
      let minDensity = 2
      let busiest = ''
      let calmest = ''

      weeklyData.forEach(row => {
        const p = row.preds[colIdx]
        totalDensity += p.density
        if (p.density > maxDensity) {
          maxDensity = p.density
          busiest = row.dest.name
        }
        if (p.density < minDensity) {
          minDensity = p.density
          calmest = row.dest.name
        }
      })

      const avgDensity = totalDensity / (weeklyData.length || 1)

      return {
        ...dayInfo,
        avgDensity,
        busiest,
        calmest,
      }
    })
  }, [days, weeklyData])

  // Find best and worst days overall
  let bestDayIdx = 0
  let worstDayIdx = 0
  dailyAggregates.forEach((agg, idx) => {
    if (agg.avgDensity < dailyAggregates[bestDayIdx].avgDensity) bestDayIdx = idx
    if (agg.avgDensity > dailyAggregates[worstDayIdx].avgDensity) worstDayIdx = idx
  })

  // Hourly prediction for selected destination
  const selectedDest = selectedDestId ? allowedDestinations.find(d => d.id === selectedDestId) : null
  const hourlyData = useMemo(() => {
    if (!selectedDest) return null
    return generateHourlyPrediction(selectedDest, 0) // Default to today
  }, [selectedDest])

  // Empty state: e.g. local manager whose destination ID no longer matches any data
  if (weeklyData.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Icon name="calendar_month" size="40px" className="text-on-surface-variant/40" />
          <p className="text-sm text-on-surface-variant">
            Belum ada data prediksi untuk destinasi Anda.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2">
            <Icon name="calendar_month" size="28px" className="text-primary" />
            Prediksi 7 Hari
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {isLocalManager ? 'Perkiraan jumlah pengunjung dan kepadatan 7 hari ke depan untuk destinasi Anda.' : 'Perkiraan jumlah pengunjung dan kepadatan 7 hari ke depan di berbagai destinasi.'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-lowest border border-stone-100 rounded-xl px-4 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-[10px] font-bold text-on-surface uppercase">Sepi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#facc15]" />
            <span className="text-[10px] font-bold text-on-surface uppercase">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f97316]" />
            <span className="text-[10px] font-bold text-on-surface uppercase">Ramai</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
            <span className="text-[10px] font-bold text-on-surface uppercase">Sangat Ramai</span>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dailyAggregates.map((agg, idx) => {
          if (idx > 3) return null // Hanya tampilkan 4 hari pertama sebagai highlight
          const isBest = idx === bestDayIdx
          const isWorst = idx === worstDayIdx
          
          return (
            <motion.div
              key={agg.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-2xl border ${
                isBest ? 'bg-primary/5 border-primary/30' : 
                isWorst ? 'bg-error/5 border-error/30' : 
                'bg-surface-container-lowest border-stone-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-on-surface">{agg.day}</p>
                  <p className="text-[11px] text-on-surface-variant">{agg.date}</p>
                </div>
                {isBest && <span className="bg-primary text-on-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Termantap</span>}
                {isWorst && <span className="bg-error text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Tersibuk</span>}
              </div>
              
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-2xl font-black font-headline ${
                  agg.avgDensity > 0.6 ? 'text-error' : agg.avgDensity < 0.4 ? 'text-primary' : 'text-on-surface'
                }`}>
                  {Math.round(agg.avgDensity * 100)}%
                </span>
                <span className="text-xs text-on-surface-variant mb-1 font-medium">rata-rata</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-500">Terpadat:</span>
                  <span className="font-semibold text-stone-700 truncate max-w-[100px] text-right">{agg.busiest}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-500">Tersepi:</span>
                  <span className="font-semibold text-stone-700 truncate max-w-[100px] text-right">{agg.calmest}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Heatmap Table ── */}
        <div className="flex-1 bg-surface-container-lowest rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="bg-surface-container-low p-4 text-xs font-bold text-on-surface uppercase tracking-wider sticky left-0 z-10 border-b border-r border-stone-200 min-w-[180px]">
                    Destinasi
                  </th>
                  {days.map((d, i) => (
                    <th key={d.date} className={`bg-surface-container-low p-3 text-center border-b border-stone-200 min-w-[80px] ${i === bestDayIdx ? 'bg-primary/10' : ''} ${i === worstDayIdx ? 'bg-error/10' : ''}`}>
                      <p className="text-xs font-bold text-on-surface uppercase">{d.dayShort}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{d.date.slice(5)}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((row, rowIdx) => (
                  <motion.tr 
                    key={row.dest.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + rowIdx * 0.03 }}
                    onClick={() => setSelectedDestId(row.dest.id === selectedDestId ? null : row.dest.id)}
                    className={`hover:bg-surface-container-low transition-colors cursor-pointer ${selectedDestId === row.dest.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-3 sticky left-0 z-10 bg-inherit border-b border-r border-stone-100">
                      <p className="text-sm font-bold text-on-surface truncate">{row.dest.name}</p>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{row.dest.category}</p>
                    </td>
                    {row.preds.map((p, colIdx) => {
                      const hexColor = getDensityHex(p.density)
                      const isDarkText = p.density > 0.3 && p.density < 0.6 // Kuning butuh teks gelap, sisanya putih
                      
                      return (
                        <td key={colIdx} className="p-1 border-b border-stone-100">
                          <div 
                            className="relative w-full h-12 rounded-xl flex flex-col items-center justify-center group transition-transform hover:scale-95"
                            style={{ backgroundColor: hexColor }}
                          >
                            <span className={`text-sm font-bold font-headline ${isDarkText ? 'text-stone-900' : 'text-white'}`}>
                              {Math.round(p.density * 100)}%
                            </span>
                            
                            {/* Event indicator */}
                            {p.hasEvent && (
                              <div className="absolute top-1 right-1">
                                <Icon name="star" filled size="10px" className={isDarkText ? 'text-stone-800' : 'text-white'} />
                              </div>
                            )}

                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[160px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                              <div className="bg-stone-800 text-white text-[10px] p-2 rounded-lg shadow-xl text-center">
                                <p className="font-bold mb-1">
                                  {p.visitors.toLocaleString('id-ID')} Pengunjung
                                </p>
                                {p.hasEvent && <p className="text-primary-container leading-tight">{p.eventName}</p>}
                              </div>
                              <div className="w-2 h-2 bg-stone-800 rotate-45 mx-auto -mt-1.5" />
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Peak Hour View (Side Panel) ── */}
        {selectedDest && hourlyData && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[300px] shrink-0 bg-surface-container-lowest rounded-3xl border border-stone-100 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-1">Detail Hari Ini</h3>
                <h4 className="text-lg font-black text-primary font-headline leading-tight">{selectedDest.name}</h4>
              </div>
              <button 
                onClick={() => setSelectedDestId(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
              >
                <Icon name="close" size="18px" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {hourlyData.map((hour, i) => (
                <div key={hour.hour} className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-stone-500 w-10 shrink-0">{hour.hour}</span>
                  <div className="flex-1 h-5 bg-surface-container-low rounded-md overflow-hidden relative group">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${hour.density * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full rounded-md"
                      style={{ backgroundColor: getDensityHex(hour.density) }}
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-[9px] font-bold text-stone-600 mix-blend-difference text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hour.visitors.toLocaleString('id-ID')} pax
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-on-surface w-8 text-right">
                    {Math.round(hour.density * 100)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="lightbulb" size="16px" className="text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase">Rekomendasi</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Untuk menghindari lonjakan staf, persiapkan shift ekstra pada jam terpadat. Rata-rata waktu tunggu terlama adalah pada jam <strong className="text-on-surface">{hourlyData.reduce((prev, curr) => curr.density > prev.density ? curr : prev).hour}</strong>.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
