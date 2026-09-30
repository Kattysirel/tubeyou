import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import Skeleton from '../components/atoms/Skeleton.jsx'
import CommentsSection from '../components/organisms/CommentsSection.jsx'
import MainLayout from '../components/organisms/MainLayout.jsx'
import RecommendedList from '../components/organisms/RecommendedList.jsx'
import VideoInfo from '../components/organisms/VideoInfo.jsx'
import VideoPlayer from '../components/organisms/VideoPlayer.jsx'
import useApi from '../hooks/useApi.js'
import { getRecommended, getVideo, registerView } from '../services/videoService.js'

export default function PlayerPage() {
  const { id } = useParams()
  const { data: video, loading, error, mutate } = useApi(() => getVideo(id), id)
  const { data: recommendedData, loading: loadingRec } = useApi(
    () => getRecommended(id).catch(() => []),
    id,
  )
  const recommended = recommendedData ?? []
  const counted = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  // Cuenta una vista por reproducción de página (la primera vez que el video empieza a reproducirse).
  const handlePlay = () => {
    if (counted.current === id) return
    counted.current = id
    registerView(id)
      .then((r) => mutate((v) => (String(v.id) === String(r.id) ? { ...v, views: r.views } : v)))
      .catch(() => {})
  }

  return (
    <MainLayout overlay>
      <div className="mx-auto grid max-w-[1750px] gap-6 pb-10 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {error ? (
          <div role="alert" className="col-span-full mx-auto mt-16 max-w-sm text-center">
            <Icon name="alert" size={44} className="mx-auto text-brand" />
            <h1 className="mt-3 text-lg font-bold text-fg">
              {error.status === 404 ? 'Este video no existe' : 'No se pudo cargar el video'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {error.status === 404 ? 'Puede que haya sido eliminado por su autor.' : error.message}
            </p>
            <Button className="mt-4" to="/">
              Volver al inicio
            </Button>
          </div>
        ) : (
          <>
            <div className="min-w-0">
              {loading || !video ? (
                <>
                  <Skeleton className="aspect-video w-full rounded-none sm:rounded-xl" />
                  <Skeleton className="mx-4 mt-4 h-7 w-3/4 sm:mx-0" />
                  <Skeleton className="mx-4 mt-4 h-24 sm:mx-0" />
                </>
              ) : (
                <>
                  <VideoPlayer video={video} onPlay={handlePlay} />
                  <VideoInfo video={video} />
                  <CommentsSection videoId={video.id} />
                </>
              )}
            </div>
            <RecommendedList videos={recommended} loading={loadingRec} />
          </>
        )}
      </div>
    </MainLayout>
  )
}
