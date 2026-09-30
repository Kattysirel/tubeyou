import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from '../components/atoms/Icon.jsx'
import Logo from '../components/atoms/Logo.jsx'
import ThemeToggle from '../components/atoms/ThemeToggle.jsx'
import AuthForm from '../components/organisms/AuthForm.jsx'

export default function AuthPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const destination = location.state?.from || '/'

  if (isAuthenticated) return <Navigate to={destination} replace />

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between px-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="grid flex-1 place-items-center px-4 py-8">
        <div className="flex w-full flex-col items-center gap-6">
          <AuthForm
            initialMode={params.get('mode') === 'register' ? 'register' : 'login'}
            onSuccess={() => navigate(destination, { replace: true })}
          />
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-fg">
            <Icon name="home" size={16} /> Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
