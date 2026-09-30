import { useState } from 'react'
import Icon from '../atoms/Icon.jsx'
import IconButton from '../atoms/IconButton.jsx'

export default function SearchBar({ initialValue = '', onSubmit, autoFocus = false, onClose }) {
  const [value, setValue] = useState(initialValue)

  const submit = (e) => {
    e.preventDefault()
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={submit} role="search" className="flex w-full items-center">
      {onClose && <IconButton icon="close" label="Cerrar búsqueda" onClick={onClose} className="mr-1 sm:hidden" />}
      <div className="group flex h-10 min-w-0 flex-1 items-center rounded-l-full border border-line bg-bg pl-4 focus-within:border-brand">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar videos"
          aria-label="Buscar videos"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Borrar texto"
            onClick={() => setValue('')}
            className="mr-1 grid size-8 place-items-center rounded-full text-fg hover:bg-hover"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Buscar"
        title="Buscar"
        className="grid h-10 w-16 shrink-0 place-items-center rounded-r-full border border-l-0 border-line bg-surface text-fg transition-colors hover:bg-surface-strong"
      >
        <Icon name="search" size={22} />
      </button>
    </form>
  )
}
