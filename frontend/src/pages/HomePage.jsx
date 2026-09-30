import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import FilterChips from '../components/molecules/FilterChips.jsx'
import MainLayout from '../components/templates/MainLayout.jsx'
import VideoGrid, { VideoGridSkeleton } from '../components/organisms/VideoGrid.jsx'
import useApi from '../hooks/useApi.js'
import { listVideos } from '../services/videoService.js'

const CHIPS = [
  { value: 'recent', label: 'Todos' },
  { value: 'popular', label: 'Populares' },
]

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const sort = params.get('sort') === 'popular' ? 'popular' : 'recent'
  const { data, loading, error, reload } = useApi(() => listVideos({ q, sort }), `${q}|${sort}`)
  const videos = data ?? []

  const changeSort = useCallback(
    (value) => {
      const next = new URLSearchParams(params)
      if (value === 'popular') next.set('sort', 'popular')
      else next.delete('sort')
      setParams(next)
    },
    [params, setParams],
  )

  return (
    <MainLayout>
      <div className="sticky top-14 z-20 bg-bg px-4 py-3 sm:px-6">
        <FilterChips options={CHIPS} value={sort} onChange={changeSort} />
      </div>

      <div className="px-4 pt-2 pb-10 sm:px-6">
        {q && (
          <h1 className="mb-5 text-lg text-fg">
            Resultados para <span className="font-bold">“{q}”</span>
          </h1>
        )}

        {error ? (
          <div role="alert" className="mx-auto mt-16 max-w-sm text-center">
            <Icon name="alert" size={40} className="mx-auto text-brand" />
            <p className="mt-3 text-fg">{error.message}</p>
            <Button variant="outline" className="mt-4" onClick={reload}>
              Reintentar
            </Button>
          </div>
        ) : loading ? (
          <VideoGridSkeleton />
        ) : videos.length === 0 ? (
          <div className="mx-auto mt-16 max-w-sm text-center">
            <Icon name="film" size={48} className="mx-auto text-muted" />
            <h2 className="mt-3 text-lg font-bold text-fg">
              {q ? 'No encontramos videos' : 'Todavía no hay videos'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {q ? 'Prueba con otras palabras clave.' : 'Sé el primero en publicar un video en TubeYou.'}
            </p>
            {q && (
              <Button variant="outline" className="mt-4" to="/">
                Ver todos los videos
              </Button>
            )}
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </MainLayout>
  )
}
