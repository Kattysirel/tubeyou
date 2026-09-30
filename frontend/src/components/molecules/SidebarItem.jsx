import { NavLink } from 'react-router-dom'
import Icon from '../atoms/Icon.jsx'

export default function SidebarItem({ to, icon, label, mini = false, active, onClick }) {
  const base = mini
    ? 'flex flex-col items-center gap-1 rounded-xl px-1 py-4 text-[10px]'
    : 'flex items-center gap-5 rounded-xl px-3 h-10 text-sm'
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end
      className={({ isActive }) =>
        `${base} transition-colors hover:bg-hover ${
          (active ?? isActive) ? 'bg-surface font-medium text-fg' : 'text-fg'
        }`
      }
    >
      <Icon name={icon} size={mini ? 22 : 24} />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
