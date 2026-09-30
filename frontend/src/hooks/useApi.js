import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carga datos de la API cuando cambia `key`.
 * El estado de carga se deriva de la clave (no se hace setState síncrono dentro del efecto).
 */
export default function useApi(fetcher, key) {
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const fetcherRef = useRef(fetcher)
  const requestKey = `${key}#${attempt}`

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    fetcherRef
      .current()
      .then((data) => !cancelled && setResult({ key: requestKey, data, error: null }))
      .catch((error) => !cancelled && setResult({ key: requestKey, data: null, error }))
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const loading = result.key !== requestKey
  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const mutate = useCallback(
    (updater) => setResult((r) => (r.data === null ? r : { ...r, data: updater(r.data) })),
    [],
  )

  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
    mutate,
  }
}
