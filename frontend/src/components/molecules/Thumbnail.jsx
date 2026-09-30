import { useState } from 'react'
import Icon from '../atoms/Icon.jsx'

/** Miniatura 16:9 con respaldo cuando la imagen no carga. */
export default function Thumbnail({ src, alt, className = '', rounded = 'rounded-xl' }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-surface ${rounded} ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="grid size-full place-items-center text-muted">
          <Icon name="film" size={36} />
        </div>
      )}
    </div>
  )
}
