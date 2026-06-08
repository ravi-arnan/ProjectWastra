import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

export default function Legal({ page }: { page: 'privacy' | 'terms' }) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-[#fff8f5]/80 backdrop-blur-xl border-b border-stone-100/50 px-6 py-4 flex items-center gap-3">
        <Link to="/" aria-label="Kembali" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-headline font-bold text-on-surface">
          {page === 'privacy' ? 'Kebijakan Privasi' : 'Ketentuan Layanan'}
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {page === 'privacy' ? <PrivacyContent /> : <TermsContent />}
      </main>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="prose prose-sm max-w-none font-body text-on-surface-variant space-y-6">
      <h2 className="text-xl font-bold text-on-surface font-headline">Kebijakan Privasi Wastra</h2>
      <p className="text-sm">Terakhir diperbarui: April 2025</p>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">1. Data yang Kami Kumpulkan</h3>
        <p>Wastra mengumpulkan data berikut untuk memberikan layanan terbaik:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Informasi akun (nama, email) saat Anda mendaftar</li>
          <li>Data lokasi untuk menampilkan destinasi terdekat (dengan izin Anda)</li>
          <li>Riwayat pemesanan tiket dan preferensi destinasi</li>
          <li>Data penggunaan aplikasi untuk peningkatan layanan</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">2. Penggunaan Data</h3>
        <p>Data Anda digunakan untuk:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Menyajikan informasi keramaian destinasi secara real-time</li>
          <li>Memberikan rekomendasi destinasi yang dipersonalisasi</li>
          <li>Memproses pemesanan tiket wisata</li>
          <li>Mengirim notifikasi tentang kondisi destinasi favorit Anda</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">3. Keamanan Data</h3>
        <p>Kami menggunakan enkripsi dan praktik keamanan standar industri untuk melindungi data Anda. Data disimpan di server yang aman dan tidak pernah dijual kepada pihak ketiga.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">4. Kontak</h3>
        <p>Untuk pertanyaan tentang privasi, hubungi kami di <a href="mailto:support@wastra.id" className="text-primary underline">support@wastra.id</a></p>
      </section>
    </div>
  )
}

function TermsContent() {
  return (
    <div className="prose prose-sm max-w-none font-body text-on-surface-variant space-y-6">
      <h2 className="text-xl font-bold text-on-surface font-headline">Ketentuan Layanan Wastra</h2>
      <p className="text-sm">Terakhir diperbarui: April 2025</p>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">1. Penerimaan Ketentuan</h3>
        <p>Dengan menggunakan aplikasi Wastra, Anda menyetujui ketentuan layanan ini. Jika Anda tidak setuju, silakan berhenti menggunakan aplikasi.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">2. Layanan</h3>
        <p>Wastra menyediakan:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Informasi tingkat keramaian destinasi wisata secara real-time</li>
          <li>Prediksi keramaian berbasis AI</li>
          <li>Pemesanan tiket wisata terintegrasi</li>
          <li>Rekomendasi destinasi alternatif</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">3. Akurasi Data</h3>
        <p>Data keramaian bersifat estimasi berdasarkan berbagai sumber. Wastra tidak menjamin akurasi 100% dan tidak bertanggung jawab atas keputusan perjalanan berdasarkan data ini.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">4. Pemesanan Tiket</h3>
        <p>Pemesanan tiket melalui Wastra tunduk pada ketentuan masing-masing destinasi. Pembatalan dan pengembalian dana mengikuti kebijakan pengelola destinasi.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-on-surface">5. Kontak</h3>
        <p>Untuk pertanyaan, hubungi kami di <a href="mailto:support@wastra.id" className="text-primary underline">support@wastra.id</a></p>
      </section>
    </div>
  )
}
