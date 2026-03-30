import type { GenerateResponse, TTSResponse } from '../types/api'

const BASE = '/api/v1'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export function generateAlgorithm(prompt: string, inputData?: unknown): Promise<GenerateResponse> {
  return post<GenerateResponse>('/generate', { prompt, input_data: inputData })
}

export function generateTTS(sentences: string[], voice = 'Rachel'): Promise<TTSResponse> {
  return post<TTSResponse>('/tts', { sentences, voice })
}

export interface RenderJobResponse {
  job_id: string
  status: 'pending' | 'running' | 'done' | 'failed'
  video_url: string | null
  error: string | null
}

export function startRender(requestId: string, voice = 'Rachel'): Promise<RenderJobResponse> {
  return post<RenderJobResponse>('/render', { request_id: requestId, voice })
}

export async function getRenderStatus(jobId: string): Promise<RenderJobResponse> {
  const res = await fetch(`${BASE}/render/${jobId}`)
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return res.json()
}
