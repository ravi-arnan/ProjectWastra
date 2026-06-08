import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { destinations as initialDestinations, type Destination } from '../../data/destinations'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'

export default function DashboardDestinasi() {
  const { isLocalManager, localManagerDestId } = useAuth()
  const [dests, setDests] = useState<Destination[]>(initialDestinations)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof Destination; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  })

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDest, setEditingDest] = useState<Destination | null>(null)
  
  // Delete Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredAndSortedDests = useMemo(() => {
    // Local managers only see their assigned destination.
    const scoped = isLocalManager && localManagerDestId
      ? dests.filter(d => d.id === localManagerDestId)
      : dests

    const q = search.toLowerCase()
    const searched = search
      ? scoped.filter(d => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q))
      : scoped

    // Copy before sorting so the source array is never mutated.
    return [...searched].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }, [dests, search, sortConfig, isLocalManager, localManagerDestId])

  const handleSort = (key: keyof Destination) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleDelete = () => {
    if (deleteId) {
      setDests(prev => prev.filter(d => d.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Auto-calculate density
    const visitors = Number(formData.get('visitors'))
    const maxCapacity = Number(formData.get('maxCapacity'))
    const density = maxCapacity > 0 ? visitors / maxCapacity : 0
    
    let densityLabel: Destination['densityLabel'] = 'Sepi'
    if (density > 0.8) densityLabel = 'Sangat Ramai'
    else if (density > 0.6) densityLabel = 'Ramai'
    else if (density > 0.3) densityLabel = 'Sedang'

    const newDest: Destination = {
      id: editingDest?.id || formData.get('name')?.toString().toLowerCase().replace(/\s+/g, '-') || Math.random().toString(),
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      region: formData.get('region') as string,
      category: formData.get('category') as string,
      distance: formData.get('distance') as string,
      density,
      densityLabel,
      visitors,
      maxCapacity,
      rating: Number(formData.get('rating')),
      reviewCount: Number(formData.get('reviewCount')),
      openHours: formData.get('openHours') as string,
      ticketPrice: formData.get('ticketPrice') as string,
      parking: formData.get('parking') as string,
      lat: Number(formData.get('lat')),
      lng: Number(formData.get('lng')),
      image: formData.get('image') as string,
      description: formData.get('description') as string,
    }

    if (editingDest) {
      setDests(prev => prev.map(d => d.id === editingDest.id ? newDest : d))
    } else {
      setDests(prev => [newDest, ...prev])
    }
    
    setIsModalOpen(false)
    setEditingDest(null)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2">
            <Icon name="location_on" size="28px" className="text-primary" />
            Kelola Destinasi
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {isLocalManager ? 'Manajemen data profil destinasi Anda.' : 'Manajemen database titik wisata (Perubahan bersifat sementara/session-only untuk versi ini).'}
          </p>
        </div>
        
        {!isLocalManager && (
          <button 
            onClick={() => {
              setEditingDest(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-md shadow-primary/20"
          >
            <Icon name="add" size="20px" />
            Tambah Destinasi
          </button>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface-container-low">
          <div className="relative w-full sm:w-80">
            <Icon name="search" size="18px" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Cari destinasi atau region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-shadow"
            />
          </div>
          <div className="text-xs font-bold text-on-surface-variant uppercase">
            Total: <span className="text-primary">{filteredAndSortedDests.length}</span> Destinasi
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-white p-4 text-xs font-bold text-on-surface uppercase tracking-wider border-b border-stone-100 w-16 text-center">Foto</th>
                <th aria-sort={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="bg-white p-4 text-xs font-bold text-on-surface uppercase tracking-wider border-b border-stone-100 cursor-pointer hover:bg-stone-50" onClick={() => handleSort('name')}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleSort('name') }} className="flex items-center gap-1 uppercase">Nama {sortConfig.key === 'name' && <span className="text-[14px]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th aria-sort={sortConfig.key === 'region' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="bg-white p-4 text-xs font-bold text-on-surface uppercase tracking-wider border-b border-stone-100 cursor-pointer hover:bg-stone-50 hidden md:table-cell" onClick={() => handleSort('region')}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleSort('region') }} className="flex items-center gap-1 uppercase">Region {sortConfig.key === 'region' && <span className="text-[14px]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th className="bg-white p-4 text-xs font-bold text-on-surface uppercase tracking-wider border-b border-stone-100 hidden sm:table-cell">Kategori</th>
                <th aria-sort={sortConfig.key === 'density' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="bg-white p-4 text-xs font-bold text-on-surface uppercase tracking-wider border-b border-stone-100 cursor-pointer hover:bg-stone-50 text-right" onClick={() => handleSort('density')}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleSort('density') }} className="flex items-center justify-end gap-1 uppercase w-full">Kepadatan {sortConfig.key === 'density' && <span className="text-[14px]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</button>
                </th>
                <th className="bg-white p-4 text-xs font-bold text-on-surface uppercase tracking-wider border-b border-stone-100 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAndSortedDests.map((dest) => (
                  <motion.tr 
                    key={dest.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    <td className="p-3 border-b border-stone-100 text-center">
                      <div className="w-10 h-10 rounded-lg overflow-hidden mx-auto bg-stone-200">
                        <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3 border-b border-stone-100">
                      <p className="text-sm font-bold text-on-surface">{dest.name}</p>
                      <p className="text-[10px] text-on-surface-variant truncate w-32 sm:hidden">{dest.region}</p>
                    </td>
                    <td className="p-3 border-b border-stone-100 hidden md:table-cell">
                      <span className="text-xs text-on-surface-variant">{dest.region}</span>
                    </td>
                    <td className="p-3 border-b border-stone-100 hidden sm:table-cell">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant">
                        {dest.category}
                      </span>
                    </td>
                    <td className="p-3 border-b border-stone-100 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold ${dest.density > 0.6 ? 'text-error' : dest.density > 0.3 ? 'text-amber-600' : 'text-primary'}`}>
                          {Math.round(dest.density * 100)}%
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">
                          {dest.visitors.toLocaleString('id-ID')} pax
                        </span>
                      </div>
                    </td>
                    <td className="p-3 border-b border-stone-100 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingDest(dest)
                            setIsModalOpen(true)
                          }}
                          className="w-8 h-8 rounded-full hover:bg-primary/10 text-primary flex items-center justify-center transition-colors"
                        >
                          <Icon name="edit" size="16px" />
                        </button>
                        {!isLocalManager && (
                          <button 
                            onClick={() => setDeleteId(dest.id)}
                            className="w-8 h-8 rounded-full hover:bg-error/10 text-error flex items-center justify-center transition-colors"
                          >
                            <Icon name="delete" size="16px" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredAndSortedDests.length === 0 && (
            <div className="py-12 text-center">
              <Icon name="search_off" size="48px" className="text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-on-surface">Tidak ada destinasi ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Form Tambah/Edit ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-surface-container-lowest">
              <h2 className="text-lg font-bold font-headline text-on-surface">
                {editingDest ? 'Edit Destinasi' : 'Tambah Destinasi Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container-high text-stone-500">
                <Icon name="close" size="20px" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Nama Destinasi *</label>
                    <input name="name" defaultValue={editingDest?.name} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Kabupaten/Kota *</label>
                    <input name="location" defaultValue={editingDest?.location} required placeholder="Contoh: Badung" className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Region Lengkap *</label>
                    <input name="region" defaultValue={editingDest?.region} required placeholder="Contoh: Kuta, Badung" className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Kategori *</label>
                    <select name="category" defaultValue={editingDest?.category || 'Pantai'} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm">
                      <option value="Pantai">Pantai</option>
                      <option value="Pura">Pura</option>
                      <option value="Alam">Alam</option>
                      <option value="Desa Wisata">Desa Wisata</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">URL Gambar *</label>
                    <input name="image" defaultValue={editingDest?.image} required placeholder="/highcompress_Image.jpg" className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Pengunjung Live</label>
                      <input name="visitors" type="number" defaultValue={editingDest?.visitors || 0} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Kapasitas Maks</label>
                      <input name="maxCapacity" type="number" defaultValue={editingDest?.maxCapacity || 5000} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Rating</label>
                      <input name="rating" type="number" step="0.1" defaultValue={editingDest?.rating || 4.5} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Total Review</label>
                      <input name="reviewCount" type="number" defaultValue={editingDest?.reviewCount || 1000} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Latitude</label>
                      <input name="lat" type="number" step="any" defaultValue={editingDest?.lat || -8.4095} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Longitude</label>
                      <input name="lng" type="number" step="any" defaultValue={editingDest?.lng || 115.1889} required className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Deskripsi Pendek</label>
                    <textarea name="description" defaultValue={editingDest?.description} required rows={2} className="w-full px-3 py-2 rounded-lg border border-outline bg-white text-sm resize-none" />
                  </div>
                  
                  {/* Hidden fields needed for Destination type consistency */}
                  <input type="hidden" name="distance" value={editingDest?.distance || "10km"} />
                  <input type="hidden" name="openHours" value={editingDest?.openHours || "08.00 - 18.00"} />
                  <input type="hidden" name="ticketPrice" value={editingDest?.ticketPrice || "Rp 50.000"} />
                  <input type="hidden" name="parking" value={editingDest?.parking || "Tersedia"} />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-stone-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-200 transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-colors">
                  Simpan Data
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Dialog Konfirmasi Hapus ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center"
          >
            <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <Icon name="delete" size="28px" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2 font-headline">Hapus Destinasi?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Apakah Anda yakin ingin menghapus destinasi ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-error hover:bg-error/90 shadow-md transition-colors cursor-pointer">
                Ya, Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
