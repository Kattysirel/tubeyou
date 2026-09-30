import { useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../atoms/Button.jsx'
import SidebarItem from '../molecules/SidebarItem.jsx'

function SectionTitle({ children }) {
  return <h2 className="px-3 pt-3 pb-1 text-base font-medium text-fg">{children}</h2>
}

export function SidebarContent({ mini = false, onNavigate }) {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const onHome = pathname === '/'
  const popular = params.get('sort') === 'popular'
  const onProfile = pathname === '/profile'
  const publishing = onProfile && params.get('publish') === '1'

  const item = (props) => <SidebarItem mini={mini} onClick={onNavigate} {...props} />

  return (
    <nav aria-label="Navegación principal" className={mini ? 'space-y-1' : 'space-y-0.5'}>
      {item({ to: '/', icon: 'home', label: 'Inicio', active: onHome && !popular && !params.get('q') })}
      {item({ to: '/?sort=popular', icon: 'flame', label: 'Populares', active: onHome && popular })}
      {isAuthenticated ? (
        <>
          {!mini && <hr className="my-3 border-line" />}
          {!mini && <SectionTitle>Tú</SectionTitle>}
          {item({ to: '/profile', icon: 'user', label: mini ? 'Perfil' : 'Mi perfil', active: onProfile && !publishing })}
          {item({ to: '/profile?publish=1', icon: 'videoPlus', label: mini ? 'Publicar' : 'Publicar video', active: publishing })}
        </>
      ) : (
        !mini && (
          <>
            <hr className="my-3 border-line" />
            <div className="px-3 py-2 text-sm text-fg">
              <p>Inicia sesión para publicar videos, comentar y gestionar tu biblioteca.</p>
              <Button to="/auth" variant="outline" icon="user" className="mt-3 text-brand" onClick={onNavigate}>
                Iniciar sesión
              </Button>
            </div>
          </>
        )
      )}
      {!mini && (
        <p className="px-3 pt-6 text-xs text-muted">© {new Date().getFullYear()} TubeYou · Proyecto académico</p>
      )}
    </nav>
  )
}

/** Riel persistente en escritorio: completo o mini. */
export default function Sidebar({ mini }) {
  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 z-30 hidden overflow-y-auto bg-bg px-3 pb-4 lg:block ${
        mini ? 'w-[76px]' : 'w-60'
      }`}
    >
      <SidebarContent mini={mini} />
    </aside>
  )
}
