import { request } from './api.js'

export const listComments = (videoId) => request(`/videos/${videoId}/comments`)
export const createComment = (videoId, content) =>
  request(`/videos/${videoId}/comments`, { method: 'POST', json: { content } })
