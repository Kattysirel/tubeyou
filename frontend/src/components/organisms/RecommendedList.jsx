import Skeleton from '../atoms/Skeleton.jsx'
import RecommendedItem from '../molecules/RecommendedItem.jsx'

export default function RecommendedList({ videos, loading }) {
  return (
    <aside aria-label="Videos recomendados" className="space-y-3 px-4 sm:px-0">
      <h2 className="text-base font-bold text-fg lg:sr-only">Recomendados</h2>
      {loading
        ? Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="aspect-video w-40 shrink-0 sm:w-44" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        : videos.map((video) => <RecommendedItem key={video.id} video={video} />)}
      {!loading && videos.length === 0 && (
        <p className="text-sm text-muted">Todavía no hay más videos para recomendar.</p>
      )}
    </aside>
  )
}
