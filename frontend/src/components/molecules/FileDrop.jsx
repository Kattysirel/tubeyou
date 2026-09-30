import { useId, useState } from 'react'
import Icon from '../atoms/Icon.jsx'

function sizeLabel(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
}

export default function FileDrop({ label, icon, accept, file, previewUrl, hint, error, onChange }) {
  const id = useId()
  const [over, setOver] = useState(false)

  const pick = (list) => {
    const chosen = list?.[0]
    if (chosen) onChange(chosen)
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          pick(e.dataTransfer.files)
        }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed p-3 text-center transition-colors ${
          over ? 'border-brand bg-brand/5' : error ? 'border-brand' : 'border-line hover:border-brand/60 hover:bg-hover'
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Vista previa de la miniatura" className="aspect-video max-h-40 rounded-lg object-cover" />
        ) : (
          <span className="grid size-11 place-items-center rounded-full bg-surface text-fg">
            <Icon name={icon} size={22} />
          </span>
        )}
        <span className="text-sm text-fg">
          {file ? (
            <>
              <span className="font-medium break-all">{file.name}</span>
              <span className="text-muted"> · {sizeLabel(file.size)}</span>
            </>
          ) : (
            <>
              <span className="font-medium text-brand">Elegir archivo</span>
              <span className="text-muted"> o arrastrarlo aquí</span>
            </>
          )}
        </span>
        {hint && !file && <span className="text-xs text-muted">{hint}</span>}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
      {error && <p className="mt-1 text-xs text-brand">{error}</p>}
    </div>
  )
}
