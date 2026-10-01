import { colorFor, initials } from '../../services/format.js'

export default function Avatar({ name = '', size = 36, className = '' }) {
  return (
    <span
      className={`grid shrink-0 select-none place-items-center rounded-full font-medium text-white ${className}`}
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  )
}
