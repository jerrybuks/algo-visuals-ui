import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { startRender, getRenderStatus, type RenderJobResponse } from '../api/client'

type Phase = 'idle' | 'starting' | 'generating' | 'rendering' | 'done' | 'failed'

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Download HD Video',
  starting: 'Starting…',
  generating: 'Generating animation…',
  rendering: 'Rendering video…',
  done: 'Download MP4',
  failed: 'Render failed — retry',
}

export function RenderButton() {
  const response = useStore((s) => s.response)
  const [phase, setPhase] = useState<Phase>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset when a new response arrives
  useEffect(() => {
    setPhase('idle')
    setVideoUrl(null)
    setError(null)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [response?.request_id])

  if (!response || response.status === 'failed') return null

  const handleClick = async () => {
    if (phase === 'done' && videoUrl) {
      window.open(videoUrl, '_blank')
      return
    }

    if (phase !== 'idle' && phase !== 'failed') return

    setPhase('starting')
    setError(null)

    try {
      const job = await startRender(response.request_id)
      setPhase('generating')
      pollForCompletion(job.job_id)
    } catch (e) {
      setPhase('failed')
      setError((e as Error).message)
    }
  }

  const pollForCompletion = (jobId: string) => {
    let dots = 0
    pollRef.current = setInterval(async () => {
      try {
        const job: RenderJobResponse = await getRenderStatus(jobId)
        dots++

        if (job.status === 'running') {
          // Alternate label to hint at progress
          setPhase(dots % 6 < 3 ? 'generating' : 'rendering')
        } else if (job.status === 'done' && job.video_url) {
          clearInterval(pollRef.current!)
          setVideoUrl(`http://localhost:8000${job.video_url}`)
          setPhase('done')
        } else if (job.status === 'failed') {
          clearInterval(pollRef.current!)
          setPhase('failed')
          setError(job.error ?? 'Render failed')
        }
      } catch {
        // keep polling
      }
    }, 3000)
  }

  const busy = phase === 'starting' || phase === 'generating' || phase === 'rendering'
  const isDone = phase === 'done'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={busy}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${isDone
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : phase === 'failed'
            ? 'bg-red-900 hover:bg-red-800 text-red-200'
            : 'bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 border border-[#2d2d4e]'
          }
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {busy && (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {isDone && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
            <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
          </svg>
        )}
        {phase === 'failed' && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        )}
        {PHASE_LABELS[phase]}
      </button>
      {error && (
        <p className="text-xs text-red-400 max-w-xs text-right whitespace-pre-wrap break-words">{error}</p>
      )}
    </div>
  )
}
