// Thin REST client for the NestJS API. Same-origin in production (SPA served by
// Nest); in dev, Vite proxies these paths to the API server. Cookies (the `jwt`
// session) are always included.
// API is mounted under /api (Nest global prefix) to avoid clashing with SPA
// routes like /players and /leagues. Vite proxies /api to the API server in dev.
const API_BASE = import.meta.env?.VITE_API_BASE ?? '/api'

const request = async (method, path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const data = await res.json()
      message = data.message ?? message
    } catch (e) {
      // non-JSON error body
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body)
export const apiPut = (path, body) => request('PUT', path, body)
export const apiDelete = (path) => request('DELETE', path)
export { API_BASE }
