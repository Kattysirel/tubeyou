import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../atoms/Button.jsx'
import Icon from '../atoms/Icon.jsx'
import IconButton from '../atoms/IconButton.jsx'
import Logo from '../atoms/Logo.jsx'
import ThemeToggle from '../atoms/ThemeToggle.jsx'
import SearchBar from '../molecules/SearchBar.jsx'
import UserMenu from '../molecules/UserMenu.jsx'

export default function Navbar({ onMenuClick }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [mobileSearch, setMobileSearch] = useState(false)

  const search = (q) => {
    setMobileSearch(false)
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-2 bg-bg px-2 sm:px-4">
      {mobileSearch ? (
        <div className="flex-1 sm:hidden">
          <SearchBar
            key="mobile"
            autoFocus
            initialValue={params.get('q') ?? ''}
            onSubmit={search}
            onClose={() => setMobileSearch(false)}
          />
        </div>
      ) : null}

      <div className={`flex items-center gap-1 sm:gap-3 ${mobileSearch ? 'hidden sm:flex' : 'flex'}`}>
        <IconButton icon="menu" label="Menú de navegación" onClick={onMenuClick} />
        <Logo />
      </div>

      <div className="hidden max-w-[720px] flex-1 px-4 sm:block">
        <SearchBar key={params.get('q') ?? ''} initialValue={params.get('q') ?? ''} onSubmit={search} />
      </div>

      <div className={`items-center gap-1 sm:gap-2 ${mobileSearch ? 'hidden sm:flex' : 'flex'}`}>
        <IconButton icon="search" label="Buscar" className="sm:hidden" onClick={() => setMobileSearch(true)} />
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <Link
              to="/profile?publish=1"
              title="Publicar video"
              aria-label="Publicar video"
              className="grid size-10 place-items-center rounded-full text-fg hover:bg-hover"
            >
              <Icon name="videoPlus" />
            </Link>
            <UserMenu user={user} onLogout={handleLogout} />
          </>
        ) : (
          <Button to="/auth" variant="outline" icon="user" className="text-brand">
            Iniciar sesión
          </Button>
        )}
      </div>
    </header>
  )
}
