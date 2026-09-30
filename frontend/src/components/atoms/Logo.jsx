import { Link } from 'react-router-dom'

export function LogoMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path d="M12 9.5v13l11-6.5z" fill="#fff" />
    </svg>
  )
}

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-1.5 rounded-md" aria-label="TubeYou, ir al inicio">
      <LogoMark />
      {!compact && (
        <span className="text-[1.35rem] font-bold tracking-tight text-fg">
          Tube<span className="text-brand">You</span>
        </span>
      )}
    </Link>
  )
}
