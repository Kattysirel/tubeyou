import { request, uploadForm } from './api.js'

export const listVideos = (params) => request('/videos', { params })
export const getVideo = (id) => request(`/videos/${id}`)
export const getRecommended = (id) => request(`/videos/${id}/recommended`)
export const registerView = (id) => request(`/videos/${id}/view`, { method: 'POST' })
export const deleteVideo = (id) => request(`/videos/${id}`, { method: 'DELETE' })

function toForm({ title, description, video, thumbnail }) {
  const form = new FormData()
  if (title !== undefined) form.append('title', title)
  if (description !== undefined) form.append('description', description)
  if (video) form.append('video_file', video)
  if (thumbnail) form.append('thumbnail_file', thumbnail)
  return form
}

export const createVideo = (data, onProgress) =>
  uploadForm('/videos', { method: 'POST', form: toForm(data), onProgress })

export const updateVideo = (id, data, onProgress) =>
  uploadForm(`/videos/${id}`, { method: 'PUT', form: toForm(data), onProgress })
