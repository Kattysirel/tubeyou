import { Link } from 'react-router-dom'
import { formatViews, timeAgo } from '../../services/format.js'
import Thumbnail from './Thumbnail.jsx'

export default function RecommendedItem({ video }) {
  return (
    <Link to={`/watch/${video.id}`} className="group flex gap-2 rounded-xl" aria-label={video.title}>
      <div className="w-40 shrink-0 sm:w-44">
        <Thumbnail src={video.thumbnail_url} alt="" rounded="rounded-lg" />
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-fg">{video.title}</h3>
        <p className="mt-1 truncate text-xs text-muted">{video.user_name}</p>
        <p className="text-xs text-muted">
          {formatViews(video.views)} · {timeAgo(video.created_at)}
        </p>
      </div>
    </Link>
  )
}
