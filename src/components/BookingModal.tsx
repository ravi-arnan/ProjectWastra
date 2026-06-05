import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { useBookings } from '../hooks/useBookings'
import { parseTicketPrice, formatCurrency, formatDate } from '../lib/utils'
import { createCharge, pollUntilSettled, type ChargeData, type PaymentStatus } from '../lib/astrapay'
import type { Destination } from '../data/destinations'
import type { Booking } from '../types/booking'

interface Props {
  destination: Destination
  isOpen: boolean
  onClose: () => void
}

export default function BookingModal({ destination, isOpen, onClose }: Props) {
  const [date, setDate] = useState('')
  const [visitors, setVisitors] = useState(1)
  const [charge, setCharge] = useState<ChargeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const { createBooking } = useBookings()

  if (!isOpen) return null

  const unitPrice = parseTicketPrice(destination.ticketPrice)
  const totalPrice = unitPrice * visitors
  const today = new Date().toISOString().split('T')[0]

  function finalize() {
    const booking = createBooking({
      destinationId: destination.id,
      destinationName: destination.name,
      date,
      visitors,
      totalPrice,
    })
    setCharge(null)
    setConfirmedBooking(booking)
  }

  async function handleConfirm() {
    if (!date) return
    // Free tickets skip payment entirely.
    if (totalPrice === 0) {
      finalize()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await createCharge(`${destination.id}-${Date.now()}`, totalPrice)
      setCharge(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat pembayaran')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setConfirmedBooking(null)
    setCharge(null)
    setError(null)
    setDate('')
    setVisitors(1)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-[390px] lg:max-w-md bg-surface-container-lowest rounded-t-3xl lg:rounded-3xl p-6 max-h-[85vh] overflow-y-auto no-scrollbar">
        {confirmedBooking ? (
          <ConfirmationView booking={confirmedBooking} onClose={handleClose} />
        ) : charge ? (
          <PaymentView
            charge={charge}
            destinationName={destination.name}
            onPaid={finalize}
            onCancel={() => setCharge(null)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-on-surface font-headline">Pesan Tiket</h2>
              <button onClick={handleClose} className="p-1.5 hover:bg-stone-100 rounded-full">
                <Icon name="close" size="20px" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3 mb-6">
              <img src={destination.image} alt={destination.name} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-sm text-on-surface">{destination.name}</p>
                <p className="text-xs text-on-surface-variant">{destination.location}, {destination.region}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-on-surface mb-1.5 block">Tanggal Kunjungan</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-on-surface mb-1.5 block">Jumlah Pengunjung</label>
                <div className="flex items-center gap-4 bg-surface-container-low rounded-xl px-4 py-2.5">
                  <button
                    onClick={() => setVisitors(Math.max(1, visitors - 1))}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center"
                  >
                    <Icon name="remove" size="18px" />
                  </button>
                  <span className="text-lg font-bold text-on-surface flex-1 text-center">{visitors}</span>
                  <button
                    onClick={() => setVisitors(Math.min(20, visitors + 1))}
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                  >
                    <Icon name="add" size="18px" />
                  </button>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant">Harga tiket</span>
                  <span className="text-on-surface">{unitPrice === 0 ? 'Gratis' : formatCurrency(unitPrice)} x {visitors}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-primary/10 pt-2">
                  <span className="text-on-surface">Total</span>
                  <span className="text-primary">{totalPrice === 0 ? 'Gratis' : formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">{error}</p>
            )}

            <button
              onClick={handleConfirm}
              disabled={!date || loading}
              className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-bold text-sm mt-6 disabled:opacity-40 transition-opacity"
            >
              {loading
                ? 'Memproses…'
                : totalPrice === 0
                  ? 'Konfirmasi Pemesanan'
                  : `Bayar dengan AstraPay`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function PaymentView({
  charge,
  destinationName,
  onPaid,
  onCancel,
}: {
  charge: ChargeData
  destinationName: string
  onPaid: () => void
  onCancel: () => void
}) {
  const [status, setStatus] = useState<PaymentStatus>('PENDING')
  // Keep the latest onPaid without re-triggering the poll effect.
  const onPaidRef = useRef(onPaid)
  useEffect(() => {
    onPaidRef.current = onPaid
  }, [onPaid])

  useEffect(() => {
    const controller = new AbortController()
    pollUntilSettled(charge.intent, { signal: controller.signal })
      .then((settled) => {
        if (controller.signal.aborted) return
        setStatus(settled)
        if (settled === 'PAID') onPaidRef.current()
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('FAILED')
      })
    return () => controller.abort()
  }, [charge.intent])

  const failed = status === 'EXPIRED' || status === 'FAILED'

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-lg font-bold text-on-surface font-headline">Pembayaran AstraPay</h2>
        <button onClick={onCancel} className="p-1.5 hover:bg-stone-100 rounded-full">
          <Icon name="close" size="20px" />
        </button>
      </div>

      {charge.mock && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-full px-3 py-1 mb-4">
          Mode simulasi — sandbox AstraPay belum aktif
        </p>
      )}

      <p className="text-sm text-on-surface-variant mb-1">{destinationName}</p>
      <p className="text-2xl font-bold text-primary mb-4">{formatCurrency(charge.amount)}</p>

      <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-4">
        <img src={charge.qrImage} alt="QRIS AstraPay" width={208} height={208} className="w-52 h-52" />
      </div>

      {failed ? (
        <>
          <p className="text-sm font-semibold text-red-600 mb-1">
            {status === 'EXPIRED' ? 'QR kedaluwarsa' : 'Pembayaran gagal'}
          </p>
          <p className="text-xs text-on-surface-variant mb-5">Silakan buat pembayaran baru.</p>
          <button
            onClick={onCancel}
            className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-bold text-sm"
          >
            Coba Lagi
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Menunggu pembayaran…
          </div>
          <p className="text-xs text-on-surface-variant">
            Scan QRIS dengan aplikasi AstraPay atau e-wallet apa pun.
          </p>
        </>
      )}
    </div>
  )
}

function ConfirmationView({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
        <Icon name="check_circle" size="36px" className="text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-on-surface font-headline mb-1">Pemesanan Berhasil!</h2>
      <p className="text-sm text-on-surface-variant mb-6">Tiket Anda telah dikonfirmasi</p>

      <div className="w-full bg-surface-container-low rounded-2xl p-5 mb-4 text-left">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-on-surface-variant">Destinasi</p>
            <p className="font-bold text-on-surface">{booking.destinationName}</p>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            Confirmed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant">Tanggal</p>
            <p className="font-semibold text-on-surface">{formatDate(booking.date)}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Pengunjung</p>
            <p className="font-semibold text-on-surface">{booking.visitors} orang</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Total</p>
            <p className="font-semibold text-primary">
              {booking.totalPrice === 0 ? 'Gratis' : formatCurrency(booking.totalPrice)}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-stone-900 rounded-2xl p-5 mb-6 text-white">
        <p className="text-xs text-stone-400 mb-1">Kode Tiket</p>
        <p className="text-2xl font-mono font-bold tracking-wider">{booking.ticketCode}</p>
        <p className="text-[10px] text-stone-400 mt-2">Tunjukkan kode ini di pintu masuk</p>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-bold text-sm"
      >
        Selesai
      </button>
    </div>
  )
}
