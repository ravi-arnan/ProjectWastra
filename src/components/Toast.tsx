import { useState, useEffect, useCallback } from 'react'
import Icon from './Icon'

interface ToastData {
  message: string
  type?: 'success' | 'info' | 'error'
}

let showToastFn: ((data: ToastData) => void) | null = null

export function showToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
  showToastFn?.({ message, type })
}

export default function ToastContainer() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const [visible, setVisible] = useState(false)

  const show = useCallback((data: ToastData) => {
    setToast(data)
    setVisible(true)
  }, [])

  useEffect(() => {
    showToastFn = show
    return () => { showToastFn = null }
  }, [show])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setToast(null), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [visible])

  if (!toast) return null

  const icons = { success: 'check_circle', info: 'info', error: 'error' }
  const colors = {
    success: 'bg-emerald-600',
    info: 'bg-primary',
    error: 'bg-error',
  }

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`${colors[toast.type || 'success']} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-medium`}>
        <Icon name={icons[toast.type || 'success']} size="18px" />
        {toast.message}
      </div>
    </div>
  )
}
