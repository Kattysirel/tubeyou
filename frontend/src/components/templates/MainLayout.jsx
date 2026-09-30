import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LogoMark } from '../atoms/Logo.jsx'
import IconButton from '../atoms/IconButton.jsx'
import Navbar from '../organisms/Navbar.jsx'
import Sidebar, { SidebarContent } from '../organisms/Sidebar.jsx'

const DESKTOP = '(min-width: 1024px)'

/**
 * Estructura común: navbar fija + sidebar.
 * `overlay` (página del reproductor): la sidebar aparece como panel flotante, como en las plataformas de video.
 */
export default function MainLayout({ children, overlay = false }) {
  const [expanded, setExpanded] = useState(true)
  // El menú lateral flotante se cierra solo al cambiar de página (queda ligado a la ruta donde se abrió).
  const [drawerPath, setDrawerPath] = useState(null)
  const { pathname } = useLocation()
  const drawer = drawerPath === pathname
  const setDrawer = (open) => setDrawerPath(open ? pathname : null)

  useEffect(() => {
    if (!drawer) return undefined
    const onKey = (e) => e.key === 'Escape' && setDrawerPath(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  const handleMenu = () => {
    if (!overlay && window.matchMedia(DESKTOP).matches) setExpanded((v) => !v)
    else setDrawer(!drawer)
  }

  const padding = overlay ? '' : expanded ? 'lg:pl-60' : 'lg:pl-[76px]'

  return (
    <div className="min-h-screen bg-bg">
      <Navbar onMenuClick={handleMenu} />
      {!overlay && <Sidebar mini={!expanded} />}

      {drawer && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-overlay"
            onClick={() => setDrawer(false)}
          />
          <aside className="animate-in absolute inset-y-0 left-0 w-64 overflow-y-auto bg-bg px-3 pb-4 shadow-xl">
            <div className="flex h-14 items-center gap-3">
              <IconButton icon="close" label="Cerrar menú" onClick={() => setDrawer(false)} />
              <span className="flex items-center gap-1.5 text-[1.35rem] font-bold tracking-tight text-fg">
                <LogoMark />
                Tube<span className="-ml-1.5 text-brand">You</span>
              </span>
            </div>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <main className={`pt-14 ${padding}`}>{children}</main>
    </div>
  )
}
