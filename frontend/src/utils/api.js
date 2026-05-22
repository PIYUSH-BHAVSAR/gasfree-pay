import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('jwt')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api

export const authApi = axios.create({ baseURL: '/auth' })
