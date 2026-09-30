const nf = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 })

export function formatViews(n = 0) {
  const text = n < 1000 ? String(n) : nf.format(n)
  return `${text} ${n === 1 ? 'vista' : 'vistas'}`
}

const UNITS = [
  ['año', 365 * 24 * 3600],
  ['mes', 30 * 24 * 3600],
  ['semana', 7 * 24 * 3600],
  ['día', 24 * 3600],
  ['hora', 3600],
  ['minuto', 60],
]

export function timeAgo(iso) {
  if (!iso) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  for (const [name, size] of UNITS) {
    const value = Math.floor(seconds / size)
    if (value >= 1) {
      const plural = value === 1 ? name : name === 'mes' ? 'meses' : `${name}s`
      return `hace ${value} ${plural}`
    }
  }
  return 'hace un momento'
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const PALETTE = ['#e50914', '#1f1f1f', '#b8070f', '#444444', '#8a0a10', '#2b2b2b', '#cc3340', '#5c5c5c']

export function colorFor(seed = '') {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}
