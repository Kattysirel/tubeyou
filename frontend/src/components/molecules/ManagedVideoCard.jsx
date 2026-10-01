import { Link } from 'react-router-dom'
import { formatDate, formatViews } from '../../services/format.js'
import Button from '../atoms/Button.jsx'
import Thumbnail from './Thumbnail.jsx'

/** Tarjeta de "Mis videos" con acciones de gestión (ver, editar, eliminar). */
export default function ManagedVideoCard({ video, layout = 'grid', onEdit, onDelete }) {
  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="soft" icon="edit" onClick={() => onEdit(video)}>
        Editar
      </Button>
      <Button size="sm" variant="outline" icon="trash" onClick={() => onDelete(video)} className="hover:text-brand">
        Eliminar
      </Button>
    </div>
  )

  if (layout === 'list') {
    return (
      <article className="group animate-in flex flex-col gap-4 rounded-2xl border border-line bg-bg p-3 transition-shadow hover:shadow-md sm:flex-row">
        <Link to={`/watch/${video.id}`} className="block w-full shrink-0 sm:w-64" aria-label={`Ver ${video.title}`}>
          <Thumbnail src={video.thumbnail_url} alt="" rounded="rounded-xl" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-medium text-fg">{video.title}</h3>
            <p className="mt-1 text-sm text-muted">
              {formatViews(video.views)} · Publicado el {formatDate(video.created_at)}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{video.description || 'Sin descripción'}</p>
          </div>
          {actions}
        </div>
      </article>
    )
  }

  return (
    <article className="group animate-in flex flex-col overflow-hidden rounded-2xl border border-line bg-bg transition-shadow hover:shadow-md">
      <Link to={`/watch/${video.id}`} className="block" aria-label={`Ver ${video.title}`}>
        <Thumbnail src={video.thumbnail_url} alt="" rounded="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-3 p-3">
        <div>
          <h3 className="line-clamp-2 text-base leading-snug font-medium text-fg">{video.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {formatViews(video.views)} · {formatDate(video.created_at)}
          </p>
        </div>
        {actions}
      </div>
    </article>
  )
}
