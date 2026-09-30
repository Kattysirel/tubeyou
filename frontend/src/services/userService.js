import { request } from './api.js'

export const registerUser = (data) => request('/users', { method: 'POST', json: data })
export const loginUser = (data) => request('/login', { method: 'POST', json: data })
export const getUser = (id) => request(`/users/${id}`)
