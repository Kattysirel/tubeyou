import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthForm from '../components/organisms/AuthForm.jsx'
import AuthLayout from '../components/templates/AuthLayout.jsx'

export default function AuthPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const destination = location.state?.from || '/'

  if (isAuthenticated) return <Navigate to={destination} replace />

  return (
    <AuthLayout>
      <AuthForm
        initialMode={params.get('mode') === 'register' ? 'register' : 'login'}
        onSuccess={() => navigate(destination, { replace: true })}
      />
    </AuthLayout>
  )
}
