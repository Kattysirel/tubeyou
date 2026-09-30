import Icon from '../atoms/Icon.jsx'

export default function StatBox({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3 shadow-sm">
      <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-bold text-fg">{value}</p>
        <p className="mt-1 truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  )
}
