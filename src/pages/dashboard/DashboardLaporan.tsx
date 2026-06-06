import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { destinations } from '../../data/destinations'
import { generateWeeklyPrediction, generateHourlyPrediction } from '../../lib/predictions'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'

// Utility to trigger file download
function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export default function DashboardLaporan() {
  const { isLocalManager, localManagerDestId } = useAuth()
  const [selectedDestId, setSelectedDestId] = useState<string>(isLocalManager && localManagerDestId ? localManagerDestId : 'semua')
  const [isExporting, setIsExporting] = useState(false)

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const allowedDestinations = useMemo(() => {
    return isLocalManager && localManagerDestId 
      ? destinations.filter(d => d.id === localManagerDestId)
      : destinations
  }, [isLocalManager, localManagerDestId])

  // Generate automated summary text
  const reportSummary = useMemo(() => {
    if (allowedDestinations.length === 0) return 'Data destinasi tidak ditemukan.'
    
    const totalVisitors = allowedDestinations.reduce((sum, d) => sum + d.visitors, 0)
    const busiest = allowedDestinations.reduce((prev, curr) => (curr.density > prev.density ? curr : prev))
    const calmest = allowedDestinations.reduce((prev, curr) => (curr.density < prev.density ? curr : prev))

    return `Laporan Eksekutif Kepadatan Wisata Bali
Tanggal: ${today}

Ringkasan:
- Total destinasi terpantau: ${allowedDestinations.length} lokasi
- Total pengunjung aktif saat ini: ${totalVisitors.toLocaleString('id-ID')} orang
- Rata-rata tingkat kepadatan area: ${Math.round(
      (allowedDestinations.reduce((s, d) => s + d.density, 0) / allowedDestinations.length) * 100
    )}%

Status Destinasi:
- Titik Terpadat: ${busiest.name} (${Math.round(busiest.density * 100)}% kapasitas, ${busiest.visitors.toLocaleString('id-ID')} pax)
- Titik Tersepi: ${calmest.name} (${Math.round(calmest.density * 100)}% kapasitas, ${calmest.visitors.toLocaleString('id-ID')} pax)

Catatan Sistem:
Data ini digenerate secara otomatis oleh sistem monitoring Wastra berdasarkan data kepadatan real-time. Diperlukan perhatian khusus untuk pengaturan lalu lintas di area ${busiest.region} akibat lonjakan pengunjung.`
  }, [today, allowedDestinations])

  // EXPORT HANDLERS
  const handleExportTxt = () => {
    setIsExporting(true)
    setTimeout(() => {
      downloadFile(reportSummary, `Wastra_Laporan_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain')
      setIsExporting(false)
    }, 600)
  }

  const handleExportCsvDestinasi = () => {
    const headers = ['ID,Nama Destinasi,Wilayah,Kategori,Pengunjung Saat Ini,Kapasitas Maksimal,Kepadatan (%)']
    const exportDests = allowedDestinations
      
    const rows = exportDests.map(
      (d) =>
        `"${d.id}","${d.name}","${d.region}","${d.category}",${d.visitors},${d.maxCapacity},${Math.round(d.density * 100)}`
    )
    const csvContent = headers.concat(rows).join('\n')
    downloadFile(csvContent, `Wastra_Kepadatan_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const handleExportCsvPrediksi = () => {
    let csvContent = ''
    if (selectedDestId === 'semua') {
      const headers = ['Nama Destinasi,Tanggal,Hari,Prediksi Pengunjung,Prediksi Kepadatan (%),Ada Event']
      const rows: string[] = []
      allowedDestinations.forEach((d) => {
        const preds = generateWeeklyPrediction(d)
        preds.forEach((p) => {
          rows.push(`"${d.name}","${p.date}","${p.day}",${p.visitors},${Math.round(p.density * 100)},"${p.hasEvent ? p.eventName : 'Tidak'}"`)
        })
      })
      csvContent = headers.concat(rows).join('\n')
    } else {
      const dest = allowedDestinations.find((d) => d.id === selectedDestId)
      if (!dest) return
      const headers = ['Jam,Prediksi Pengunjung,Prediksi Kepadatan (%)']
      const preds = generateHourlyPrediction(dest)
      const rows = preds.map((p) => `"${p.hour}",${p.visitors},${Math.round(p.density * 100)}`)
      csvContent = headers.concat(rows).join('\n')
    }
    
    downloadFile(csvContent, `Wastra_Prediksi_${selectedDestId}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2">
          <Icon name="download" size="28px" className="text-primary" />
          Export & Laporan
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Unduh data kepadatan, prediksi, dan ringkasan eksekutif harian untuk keperluan administratif.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* ── Ringkasan Eksekutif (Kiri, 3 Kolom) ── */}
        <div className="lg:col-span-3 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest border border-stone-200 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="receipt_long" size="20px" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface font-headline">Laporan Eksekutif Harian</h2>
                  <p className="text-xs text-on-surface-variant">Auto-generated teks summary</p>
                </div>
              </div>
              <button
                onClick={handleExportTxt}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-full hover:bg-primary-container transition-colors disabled:opacity-70"
              >
                <Icon name={isExporting ? 'refresh' : 'download'} size="18px" className={isExporting ? 'animate-spin' : ''} />
                {isExporting ? 'Memproses...' : 'Unduh .TXT'}
              </button>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-5 font-mono text-xs text-stone-700 leading-relaxed whitespace-pre-wrap h-[280px] overflow-y-auto">
              {reportSummary}
            </div>
          </motion.div>
        </div>

        {/* ── Opsi Export CSV (Kanan, 2 Kolom) ── */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-lowest border border-stone-200 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-base font-bold text-on-surface font-headline flex items-center gap-2 mb-4">
              <Icon name="query_stats" size="20px" className="text-primary" />
              Dataset Lengkap (CSV)
            </h2>

            <div className="space-y-4">
              {/* Export 1: Kepadatan Saat Ini */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-stone-100">
                <h3 className="text-sm font-bold text-on-surface mb-1">Status Kepadatan Live</h3>
                <p className="text-[11px] text-on-surface-variant mb-3">
                  {isLocalManager ? 'Data real-time pengunjung destinasi Anda.' : 'Data real-time pengunjung dan persentase kapasitas seluruh destinasi.'}
                </p>
                <button
                  onClick={handleExportCsvDestinasi}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-outline text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="download" size="18px" />
                  Download CSV
                </button>
              </div>

              {/* Export 2: Data Prediksi */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-stone-100">
                <h3 className="text-sm font-bold text-on-surface mb-1">Data Prediksi</h3>
                <p className="text-[11px] text-on-surface-variant mb-3">
                  {isLocalManager ? 'Unduh rincian prediksi per-jam untuk destinasi Anda.' : 'Pilih destinasi untuk mengunduh prediksi per-jam, atau "Semua" untuk prediksi 7 hari.'}
                </p>
                
                <select
                  value={selectedDestId}
                  onChange={(e) => setSelectedDestId(e.target.value)}
                  disabled={isLocalManager}
                  className="w-full bg-white border border-outline-variant rounded-xl text-sm font-semibold text-on-surface px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 mb-3 disabled:opacity-70 disabled:bg-stone-50"
                >
                  {!isLocalManager && <option value="semua">Semua Destinasi (7 Hari)</option>}
                  {destinations
                    .filter(d => isLocalManager ? d.id === localManagerDestId : true)
                    .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Detail Per Jam)
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleExportCsvPrediksi}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-outline text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="download" size="18px" />
                  Download CSV
                </button>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
