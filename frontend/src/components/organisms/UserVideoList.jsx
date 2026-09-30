import { useState } from 'react'
import Button from '../atoms/Button.jsx'
import Icon from '../atoms/Icon.jsx'
import IconButton from '../atoms/IconButton.jsx'
import Skeleton from '../atoms/Skeleton.jsx'
import ManagedVideoCard from '../molecules/ManagedVideoCard.jsx'

export default function UserVideoList({ videos, loading, error, onPublish, onEdit, onDelete, onRetry }) {
  const [layout, setLayout] = useState('grid')

  return (
    <section aria-labelledby="my-videos" className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="my-videos" className="text-xl font-bold text-fg">
          Mis videos <span className="ml-1 text-base font-normal text-muted">({videos.length})</span>
        </h2>
        <div className="flex rounded-full bg-surface p-0.5" role="group" aria-label="Vista">
          {[
            ['grid', 'grid', 'Cuadrícula'],
            ['list', 'list', 'Lista'],
          ].map(([value, icon, label]) => (
            <IconButton
              key={value}
              icon={icon}
              label={label}
              size={20}
              aria-pressed={layout === value}
              onClick={() => setLayout(value)}
              className={`size-9 ${layout === value ? 'bg-bg shadow-sm' : ''}`}
            />
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-line p-8 text-center">
          <p className="text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand/10 text-brand">
            <Icon name="videoPlus" size={32} />
          </span>
          <h3 className="mt-4 text-lg font-bold text-fg">Aún no has publicado videos</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Sube tu primer video en formato MP4 y comparte tu contenido con la comunidad de TubeYou.
          </p>
          <Button className="mt-5" icon="upload" onClick={onPublish}>
            Publicar mi primer video
          </Button>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
          {videos.map((v) => (
            <ManagedVideoCard key={v.id} video={v} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => (
            <ManagedVideoCard key={v.id} video={v} layout="list" onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
