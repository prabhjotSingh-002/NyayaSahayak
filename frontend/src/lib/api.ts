import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorText = await res.text()
    let errorDetail = errorText
    try {
      const errorJson = JSON.parse(errorText)
      errorDetail = errorJson.detail || errorJson.message || errorText
    } catch {}
    throw new Error(errorDetail || `API request failed with status ${res.status}`)
  }

  return res.json()
}
