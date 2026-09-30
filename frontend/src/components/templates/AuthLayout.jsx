import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon.jsx'
import Logo from '../atoms/Logo.jsx'
import ThemeToggle from '../atoms/ThemeToggle.jsx'

/** Plantilla para la página de acceso: cabecera mínima y contenido centrado, sin sidebar. */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between px-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="grid flex-1 place-items-center px-4 py-8">
        <div className="flex w-full flex-col items-center gap-6">
          {children}
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-fg">
            <Icon name="home" size={16} /> Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
