import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setUnauthorizedHandler, tokenStore } from '../services/api.js'
import { getUser, loginUser, registerUser } from '../services/userService.js'

const AuthContext = createContext(null)
const USER_KEY = 'tubeyou-user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw && tokenStore.get() ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const logout = useCallback(() => {
    tokenStore.clear()
    storeUser(null)
    setUser(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password })
    tokenStore.set(data.access_token)
    storeUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async ({ name, email, password }) => {
      await registerUser({ name, email, password })
      return login(email, password)
    },
    [login],
  )

  const refreshUser = useCallback(async (id) => {
    const fresh = await getUser(id)
    storeUser(fresh)
    setUser(fresh)
    return fresh
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  // Revalida la sesión guardada contra la API al abrir la app.
  useEffect(() => {
    const stored = readStoredUser()
    if (stored) getUser(stored.id).then((fresh) => {
      storeUser(fresh)
      setUser(fresh)
    }).catch(() => {})
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, register, logout, refreshUser }),
    [user, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
