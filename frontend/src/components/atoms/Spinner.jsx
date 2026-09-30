export default function Spinner({ size = 28, className = '' }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-2 border-line border-t-brand ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
