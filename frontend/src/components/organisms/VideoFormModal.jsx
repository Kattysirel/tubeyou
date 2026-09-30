import { useEffect, useMemo, useState } from 'react'
import { createVideo, updateVideo } from '../../services/videoService.js'
import Button from '../atoms/Button.jsx'
import FileDrop from '../molecules/FileDrop.jsx'
import FormField from '../molecules/FormField.jsx'
import Modal from './Modal.jsx'

const MAX_VIDEO = 100 * 1024 * 1024
const MAX_THUMB = 5 * 1024 * 1024

function validateVideo(file) {
  if (!file) return ''
  if (!/\.mp4$/i.test(file.name) || file.type !== 'video/mp4') return 'Solo se permiten videos en formato MP4'
  if (file.size > MAX_VIDEO) return 'El video no puede superar los 100 MB'
  return ''
}

function validateThumb(file) {
  if (!file) return ''
  if (!/\.(jpe?g|png)$/i.test(file.name) || !['image/jpeg', 'image/png'].includes(file.type))
    return 'Solo se permiten imágenes JPG, JPEG o PNG'
  if (file.size > MAX_THUMB) return 'La miniatura no puede superar los 5 MB'
  return ''
}

/** Publicar (video === null) o editar un video existente. */
export default function VideoFormModal({ video, onClose, onSaved }) {
  const editing = !!video
  const [title, setTitle] = useState(video?.title ?? '')
  const [description, setDescription] = useState(video?.description ?? '')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [progress, setProgress] = useState(null)
  const saving = progress !== null

  const thumbPreview = useMemo(() => (thumbFile ? URL.createObjectURL(thumbFile) : null), [thumbFile])
  useEffect(() => () => thumbPreview && URL.revokeObjectURL(thumbPreview), [thumbPreview])

  const pickVideo = (file) => {
    setVideoFile(file)
    setErrors((e) => ({ ...e, video: validateVideo(file) }))
  }
  const pickThumb = (file) => {
    setThumbFile(file)
    setErrors((e) => ({ ...e, thumbnail: validateThumb(file) }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {
      title: title.trim() ? '' : 'El título es obligatorio',
      video: validateVideo(videoFile) || (!editing && !videoFile ? 'Selecciona un video MP4' : ''),
      thumbnail: validateThumb(thumbFile) || (!editing && !thumbFile ? 'Selecciona una miniatura' : ''),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setServerError('')
    setProgress(0)
    try {
      const data = { title: title.trim(), description: description.trim(), video: videoFile, thumbnail: thumbFile }
      const saved = editing ? await updateVideo(video.id, data, setProgress) : await createVideo(data, setProgress)
      onSaved(saved, editing)
    } catch (err) {
      setServerError(err.message)
      setProgress(null)
    }
  }

  return (
    <Modal title={editing ? 'Editar video' : 'Publicar video'} onClose={onClose} wide locked={saving}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormField
          label="Título"
          value={title}
          maxLength={150}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Añade un título que describa tu video"
          error={errors.title}
        />
        <FormField
          as="textarea"
          rows={4}
          label="Descripción"
          value={description}
          maxLength={5000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cuéntales a los espectadores de qué trata tu video"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FileDrop
            label={editing ? 'Reemplazar video (opcional)' : 'Video'}
            icon="film"
            accept="video/mp4,.mp4"
            file={videoFile}
            hint="MP4 · máximo 100 MB"
            error={errors.video}
            onChange={pickVideo}
          />
          <FileDrop
            label={editing ? 'Reemplazar miniatura (opcional)' : 'Miniatura'}
            icon="image"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            file={thumbFile}
            previewUrl={thumbPreview ?? (editing ? video.thumbnail_url : null)}
            hint="JPG, JPEG o PNG · máximo 5 MB"
            error={errors.thumbnail}
            onChange={pickThumb}
          />
        </div>

        {saving && (
          <div aria-live="polite">
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {progress < 100 ? `Subiendo… ${progress}%` : 'Procesando…'}
            </p>
          </div>
        )}
        {serverError && (
          <p role="alert" className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" icon={editing ? 'check' : 'upload'} loading={saving}>
            {editing ? 'Guardar cambios' : 'Publicar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
