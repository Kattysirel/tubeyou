import { useEffect } from 'react'
import IconButton from '../atoms/IconButton.jsx'

export default function Modal({ title, onClose, children, wide = false, locked = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !locked && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose, locked])

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar"
        disabled={locked}
        onClick={onClose}
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-in relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-bg shadow-2xl ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          <IconButton icon="close" label="Cerrar" onClick={onClose} disabled={locked} />
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
