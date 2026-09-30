import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar.jsx'
import Icon from '../atoms/Icon.jsx'

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
        className="grid size-10 place-items-center rounded-full"
      >
        <Avatar name={user.name} size={32} />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-in absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-bg shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Avatar name={user.name} size={44} />
            <div className="min-w-0">
              <p className="truncate font-medium text-fg">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <div className="p-2">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center gap-4 rounded-lg px-3 text-sm text-fg hover:bg-hover"
            >
              <Icon name="user" size={20} /> Mi perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="flex h-10 w-full items-center gap-4 rounded-lg px-3 text-sm text-fg hover:bg-hover"
            >
              <Icon name="logout" size={20} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
