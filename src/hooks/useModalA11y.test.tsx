import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { useModalA11y } from './useModalA11y'

function Dialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const ref = useModalA11y<HTMLDivElement>(isOpen, onClose)
  if (!isOpen) return null
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Test" tabIndex={-1}>
      <button type="button">first</button>
      <button type="button">last</button>
    </div>
  )
}

afterEach(cleanup)

describe('useModalA11y', () => {
  test('moves focus to the first focusable element on open', () => {
    render(<Dialog isOpen onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'first' }))
  })

  test('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<Dialog isOpen onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('does not call onClose on Escape while closed', () => {
    const onClose = vi.fn()
    render(<Dialog isOpen={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  test('wraps focus from last to first on Tab', () => {
    render(<Dialog isOpen onClose={() => {}} />)
    const last = screen.getByRole('button', { name: 'last' })
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'first' }))
  })

  test('wraps focus from first to last on Shift+Tab', () => {
    render(<Dialog isOpen onClose={() => {}} />)
    const first = screen.getByRole('button', { name: 'first' })
    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'last' }))
  })

  test('restores focus to the trigger element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const { rerender } = render(<Dialog isOpen onClose={() => {}} />)
    expect(document.activeElement).not.toBe(trigger)

    rerender(<Dialog isOpen={false} onClose={() => {}} />)
    expect(document.activeElement).toBe(trigger)

    document.body.removeChild(trigger)
  })
})
