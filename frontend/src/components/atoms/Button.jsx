import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const VARIANTS = {
  primary: 'bg-brand text-on-brand hover:bg-brand-strong',
  dark: 'bg-fg text-bg hover:opacity-85',
  soft: 'bg-surface text-fg hover:bg-surface-strong',
  outline: 'border border-line text-fg hover:bg-hover',
  ghost: 'text-fg hover:bg-hover',
  danger: 'bg-brand text-on-brand hover:bg-brand-strong',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  to,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`
  const content = (
    <>
      {icon && <Icon name={icon} size={18} />}
      {loading ? 'Procesando…' : children}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} {...props} disabled={loading || disabled}>
      {content}
    </button>
  )
}
