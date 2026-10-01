import { timeAgo } from '../../services/format.js'
import Avatar from '../atoms/Avatar.jsx'

export default function CommentItem({ comment }) {
  return (
    <li className="flex gap-3 animate-in">
      <Avatar name={comment.user_name} size={40} />
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium text-fg">{comment.user_name}</span>
          <span className="ml-2 text-xs text-muted">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="mt-0.5 text-sm break-words whitespace-pre-line text-fg">{comment.content}</p>
      </div>
    </li>
  )
}
