import Icon from './Icon.jsx'

export default function IconButton({ icon, label, size = 24, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-10 place-items-center rounded-full text-fg transition-colors hover:bg-hover ${className}`}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}
