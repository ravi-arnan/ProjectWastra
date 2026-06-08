import { useState } from 'react'
import Icon from './Icon'
import { useModalA11y } from '../hooks/useModalA11y'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { generateId } from '../lib/utils'

interface Review {
  id: string
  destinationId: string
  rating: number
  comment: string
  createdAt: string
}

interface Props {
  destinationId: string
  destinationName: string
  isOpen: boolean
  onClose: () => void
}

export default function ReviewModal({ destinationId, destinationName, isOpen, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, handleClose)

  if (!isOpen) return null

  function handleSubmit() {
    if (rating === 0) return
    const reviews = getStorageItem<Review[]>(STORAGE_KEYS.REVIEWS, [])
    reviews.unshift({
      id: generateId(),
      destinationId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    })
    setStorageItem(STORAGE_KEYS.REVIEWS, reviews)
    setSubmitted(true)
  }

  function handleClose() {
    setRating(0)
    setComment('')
    setSubmitted(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tulis ulasan"
        tabIndex={-1}
        className="relative w-full max-w-[390px] lg:max-w-md bg-surface-container-lowest rounded-t-3xl lg:rounded-3xl p-6"
      >
        {submitted ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Icon name="check_circle" size="32px" className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1">Terima kasih!</h3>
            <p className="text-sm text-on-surface-variant mb-4">Ulasan Anda untuk {destinationName} telah disimpan.</p>
            <button type="button" onClick={handleClose} className="bg-primary text-on-primary rounded-xl px-6 py-2.5 font-bold text-sm">
              Selesai
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-on-surface font-headline">Tulis Ulasan</h2>
              <button type="button" onClick={handleClose} aria-label="Tutup" className="p-1.5 hover:bg-stone-100 rounded-full">
                <Icon name="close" size="20px" />
              </button>
            </div>

            <p className="text-sm text-on-surface-variant mb-4">{destinationName}</p>

            <div className="flex gap-2 justify-center mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Beri ${star} bintang`}
                  aria-pressed={star <= rating}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Icon
                    name="star"
                    size="32px"
                    filled={star <= (hoverRating || rating)}
                    className={star <= (hoverRating || rating) ? 'text-amber-500' : 'text-stone-300'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-label="Komentar ulasan"
              placeholder="Bagikan pengalaman Anda... (opsional)"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-primary/30 resize-none h-24"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-bold text-sm mt-4 disabled:opacity-40"
            >
              Kirim Ulasan
            </button>
          </>
        )}
      </div>
    </div>
  )
}
