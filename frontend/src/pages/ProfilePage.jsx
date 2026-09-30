import { useEffect, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/organisms/ConfirmDialog.jsx'
import MainLayout from '../components/templates/MainLayout.jsx'
import ProfileHeader from '../components/organisms/ProfileHeader.jsx'
import UserVideoList from '../components/organisms/UserVideoList.jsx'
import VideoFormModal from '../components/organisms/VideoFormModal.jsx'
import useApi from '../hooks/useApi.js'
import { deleteVideo, listVideos } from '../services/videoService.js'

export default function ProfilePage() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState(null) // null = sin cambios manuales | { video: null | Video }
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')

  const userId = user?.id
  const {
    data,
    loading,
    error: loadError,
    reload: load,
  } = useApi(() => (userId ? listVideos({ user_id: userId, limit: 100 }) : Promise.resolve([])), String(userId))
  const videos = data ?? []
  const error = loadError?.message ?? ''

  // /profile?publish=1 (sidebar / navbar) abre directamente el formulario de publicación.
  const openForm = form ?? (params.get('publish') === '1' ? { video: null } : null)
  const closeForm = () => {
    setForm(null)
    if (params.get('publish')) {
      const next = new URLSearchParams(params)
      next.delete('publish')
      setParams(next, { replace: true })
    }
  }

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(t)
  }, [notice])

  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location.pathname }} replace />

  const handleSaved = async (_saved, wasEditing) => {
    closeForm()
    setNotice(wasEditing ? 'Video actualizado correctamente' : 'Video publicado correctamente')
    await load()
    refreshUser(userId).catch(() => {})
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteVideo(toDelete.id)
      setToDelete(null)
      setNotice('Video eliminado')
      await load()
      refreshUser(userId).catch(() => {})
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-12 sm:px-6">
        <ProfileHeader user={user} videos={videos} onPublish={() => setForm({ video: null })} />
        <UserVideoList
          videos={videos}
          loading={loading}
          error={error}
          onRetry={load}
          onPublish={() => setForm({ video: null })}
          onEdit={(video) => setForm({ video })}
          onDelete={(video) => {
            setDeleteError('')
            setToDelete(video)
          }}
        />
      </div>

      {openForm && <VideoFormModal video={openForm.video} onClose={closeForm} onSaved={handleSaved} />}
      {toDelete && (
        <ConfirmDialog
          title="Eliminar video"
          message={`¿Seguro que quieres eliminar “${toDelete.title}”? Se borrarán también sus comentarios y archivos. Esta acción no se puede deshacer.`}
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
      {notice && (
        <div
          role="status"
          className="animate-in fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-fg px-5 py-3 text-sm text-bg shadow-xl"
        >
          {notice}
        </div>
      )}
    </MainLayout>
  )
}
