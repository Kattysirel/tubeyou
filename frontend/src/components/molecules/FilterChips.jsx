export default function FilterChips({ options, value, onChange }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto" role="tablist" aria-label="Filtrar videos">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`h-8 shrink-0 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
              selected ? 'bg-fg text-bg' : 'bg-surface text-fg hover:bg-surface-strong'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
