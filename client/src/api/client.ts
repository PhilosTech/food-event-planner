import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

api.interceptors.request.use((config) => {
  const { adminToken } = useAuthStore.getState()
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
  }
  return config
})

export function apiWithRoomToken(slug: string) {
  const access = useAuthStore.getState().getRoomAccess(slug)
  return axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
    headers: access ? { Authorization: `Bearer ${access.token}` } : {},
  })
}

export { api };
export default api
