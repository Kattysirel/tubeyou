// URL de la API: sin espacios ni barras finales (evita peticiones como //videos detras de CloudFront)
const rawApiUrl =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:8000' : '')

export const API_URL = (rawApiUrl || '').trim().replace(/\/+$/, '')

const TOKEN_KEY = 'tubeyou-token'

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* almacenamiento no disponible */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* almacenamiento no disponible */
    }
  },
}

let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function messageFrom(payload, status) {
  const detail = payload?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0]
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : ''
    return field ? `${field}: ${first.msg}` : first.msg
  }
  if (status === 413) return 'El archivo es demasiado grande'
  return 'Ocurrió un error inesperado'
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

async function handle(response) {
  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && tokenStore.get()) onUnauthorized()
    throw new ApiError(messageFrom(payload, response.status), response.status)
  }
  return payload
}

export async function request(path, { method = 'GET', json, form, params } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form
  }
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))
    : ''
  let response
  try {
    response = await fetch(`${API_URL}${path}${query === '?' ? '' : query}`, { method, headers, body })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }
  return handle(response)
}

/** Envío multipart con progreso (fetch aún no expone el progreso de subida). */
export function uploadForm(path, { method = 'POST', form, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, `${API_URL}${path}`)
    const token = tokenStore.get()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onerror = () => reject(new ApiError('No se pudo conectar con el servidor', 0))
    xhr.onload = () => {
      const payload = parseJson(xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300) return resolve(payload)
      if (xhr.status === 401 && token) onUnauthorized()
      reject(new ApiError(messageFrom(payload, xhr.status), xhr.status))
    }
    xhr.send(form)
  })
}
