import Skeleton from '../atoms/Skeleton.jsx'
import VideoCard from '../molecules/VideoCard.jsx'

export const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-x-4 gap-y-8'

export function VideoGridSkeleton({ count = 8 }) {
  return (
    <div className={GRID} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="mt-3 flex gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function VideoGrid({ videos }) {
  return (
    <div className={GRID}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
