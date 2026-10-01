import { useState } from 'react'
import { formatDate, formatViews, timeAgo } from '../../services/format.js'
import Avatar from '../atoms/Avatar.jsx'

export default function VideoInfo({ video }) {
  const [expanded, setExpanded] = useState(false)
  const description = video.description?.trim()
  const long = (description?.length ?? 0) > 180 || (description?.split('\n').length ?? 0) > 3

  return (
    <section className="mt-3 px-4 sm:px-0">
      <h1 className="text-xl leading-snug font-bold text-fg">{video.title}</h1>

      <div className="mt-3 flex items-center gap-3">
        <Avatar name={video.user_name} size={40} />
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{video.user_name}</p>
          <p className="text-xs text-muted">Creador</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-surface p-3 text-sm text-fg">
        <p className="font-medium">
          {formatViews(video.views)} · {timeAgo(video.created_at)}
          <span className="ml-2 font-normal text-muted">{formatDate(video.created_at)}</span>
        </p>
        <p className={`mt-2 break-words whitespace-pre-line ${expanded || !long ? '' : 'line-clamp-2'}`}>
          {description || 'Este video no tiene descripción.'}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 font-medium text-fg hover:underline"
          >
            {expanded ? 'Mostrar menos' : '…más'}
          </button>
        )}
      </div>
    </section>
  )
}
