import { Link } from 'react-router-dom'
import { formatViews, timeAgo } from '../../services/format.js'
import Avatar from '../atoms/Avatar.jsx'
import Thumbnail from './Thumbnail.jsx'

export default function VideoCard({ video }) {
  return (
    <article className="group animate-in">
      <Link to={`/watch/${video.id}`} className="block rounded-xl" aria-label={video.title}>
        <Thumbnail src={video.thumbnail_url} alt="" />
      </Link>
      <div className="mt-3 flex gap-3">
        <Avatar name={video.user_name} size={36} />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base leading-snug font-medium text-fg">
            <Link to={`/watch/${video.id}`}>{video.title}</Link>
          </h3>
          <p className="mt-1 truncate text-sm text-muted">{video.user_name}</p>
          <p className="text-sm text-muted">
            {formatViews(video.views)} · {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    </article>
  )
}
