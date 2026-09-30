import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../atoms/Button.jsx'
import Logo from '../atoms/Logo.jsx'
import FormField from '../molecules/FormField.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TABS = [
  { value: 'login', label: 'Iniciar sesión' },
  { value: 'register', label: 'Crear cuenta' },
]

export default function AuthForm({ initialMode = 'login', onSuccess }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const switchMode = (next) => {
    setMode(next)
    setErrors({})
    setServerError('')
  }

  const validate = () => {
    const next = {}
    if (isRegister && form.name.trim().length < 2) next.name = 'Escribe tu nombre (mínimo 2 caracteres)'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Ingresa un correo válido'
    if (form.password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres'
    return next
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    setServerError('')
    try {
      const email = form.email.trim()
      if (isRegister) await register({ name: form.name.trim(), email, password: form.password })
      else await login(email, form.password)
      onSuccess()
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in w-full max-w-md rounded-3xl border border-line bg-bg p-6 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold text-fg">{isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isRegister ? 'Comparte tus videos con el mundo' : 'Inicia sesión para continuar en TubeYou'}
        </p>
      </div>

      <div role="tablist" className="mt-6 grid grid-cols-2 rounded-full bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => switchMode(tab.value)}
            className={`h-9 rounded-full text-sm font-medium transition-colors ${
              mode === tab.value ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {isRegister && (
          <FormField
            label="Nombre"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            placeholder="Tu nombre"
            error={errors.name}
          />
        )}
        <FormField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          placeholder="tu@correo.com"
          error={errors.email}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={form.password}
          onChange={set('password')}
          placeholder="Mínimo 6 caracteres"
          error={errors.password}
        />

        {serverError && (
          <p role="alert" className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </Button>
      </form>
    </div>
  )
}
