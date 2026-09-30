import { formatViews } from '../../utils/format.js'
import Avatar from '../atoms/Avatar.jsx'
import Button from '../atoms/Button.jsx'
import Icon from '../atoms/Icon.jsx'
import StatBox from '../molecules/StatBox.jsx'

export default function ProfileHeader({ user, videos, onPublish }) {
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0)
  const top = videos.reduce((best, v) => (!best || v.views > best.views ? v : best), null)

  return (
    <header className="animate-in">
      <div className="relative h-36 overflow-hidden rounded-3xl bg-linear-to-br from-brand via-brand-strong to-black sm:h-48">
        <div className="absolute -top-10 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 size-64 rounded-full bg-black/25 blur-2xl" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative -mt-12 flex flex-col gap-4 px-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex items-end gap-4">
          <span className="rounded-full bg-bg p-1.5">
            <Avatar name={user.name} size={96} />
          </span>
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-2xl font-bold text-fg sm:text-3xl">{user.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
              <Icon name="mail" size={16} /> {user.email}
            </p>
          </div>
        </div>
        <Button size="lg" icon="videoPlus" onClick={onPublish} className="shadow-lg shadow-brand/25">
          Publicar video
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatBox icon="film" label="Videos publicados" value={videos.length} />
        <StatBox icon="eye" label="Vistas totales" value={formatViews(totalViews).split(' ')[0]} />
        <StatBox
          icon="flame"
          label={top ? `Más visto: ${top.title}` : 'Video más visto'}
          value={top ? formatViews(top.views).split(' ')[0] : '—'}
        />
      </div>
    </header>
  )
}
