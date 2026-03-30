import { useState, useRef, useEffect } from 'react'

const API = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000') + '/api/v1'
const POLL_INTERVAL = 3000

type Status = 'idle' | 'pending' | 'narrating' | 'synthesizing' | 'generating' | 'rendering' | 'mixing' | 'done' | 'failed'

interface AlgorithmInfo {
  name?: string
  execution_model?: string
  complexity?: {
    work?: string
    span?: string
    time?: string
    space?: string
  }
}

interface HistoryItem {
  job_id: string
  prompt: string
  status: string
  video_url: string | null
  algorithm: AlgorithmInfo | null
  steps: string[]
  narration: string[]
  is_public: boolean
  created_at: string
}

const STEPS: { key: string; label: string }[] = [
  { key: 'narrating',    label: 'Writing narration' },
  { key: 'synthesizing', label: 'Generating voiceover' },
  { key: 'generating',   label: 'Building animation scene' },
  { key: 'rendering',    label: 'Rendering video (~30–60s)' },
  { key: 'mixing',       label: 'Mixing audio and video' },
]

function stepIndex(status: Status) {
  return STEPS.findIndex(s => s.key === status)
}

function ComplexityCard({ info }: { info: AlgorithmInfo }) {
  const isParallel = info.execution_model === 'parallel'
  const c = info.complexity ?? {}

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100">{info.name ?? 'Algorithm'}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
            ${isParallel ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
            {isParallel ? 'PARALLEL' : 'SERIAL'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isParallel ? (
          <>
            <ComplexityCell label="Work" value={c.work} hint="Total operations across all processors" />
            <ComplexityCell label="Span" value={c.span} hint="Runtime with unlimited processors" />
          </>
        ) : (
          <>
            <ComplexityCell label="Time" value={c.time} hint="Operations relative to input size" />
            <ComplexityCell label="Space" value={c.space} hint="Extra memory used" />
          </>
        )}
      </div>
    </div>
  )
}

function ComplexityCell({ label, value, hint }: { label: string; value?: string; hint: string }) {
  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3 flex flex-col gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-mono font-bold text-indigo-300">{value ?? '—'}</span>
      <span className="text-xs text-slate-600 leading-snug">{hint}</span>
    </div>
  )
}

function getThumbUrl(videoUrl: string | null): string | null {
  if (!videoUrl || !videoUrl.includes('res.cloudinary.com')) return null
  return videoUrl
    .replace('/upload/', '/upload/w_640,h_360,c_fill,so_23/')
    .replace('.mp4', '.jpg')
}

function StepsCard({ steps }: { steps: string[] }) {
  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Algorithm Steps</p>
      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className="w-5 h-5 rounded-full bg-indigo-900 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

function GenerationDetail({ item, onBack }: { item: HistoryItem; onBack: () => void }) {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <span className="text-slate-700">|</span>
        <span className="text-sm text-slate-400 truncate">{item.prompt}</span>
      </div>

      {/* Video */}
      {item.video_url && (
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
          <video src={item.video_url} controls autoPlay className="w-full" />
        </div>
      )}

      {/* Algorithm details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {item.algorithm && Object.keys(item.algorithm).length > 0 && (
          <ComplexityCard info={item.algorithm} />
        )}
        {(item.steps?.length ?? 0) > 0 && <StepsCard steps={item.steps} />}
      </div>

      {/* Narration script */}
      {(item.narration?.length ?? 0) > 0 && (
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Narration Script</p>
          <ol className="flex flex-col gap-2">
            {item.narration.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                <span className="text-xs text-slate-600 font-mono w-5 shrink-0 mt-0.5">{i + 1}.</span>
                {line}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Download */}
      {item.video_url && (
        <a href={item.video_url} download
           className="self-end text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Download MP4
        </a>
      )}
    </div>
  )
}

function getJobIdFromPath(): string | null {
  const match = window.location.pathname.match(/^\/generation\/([^/]+)$/)
  return match ? match[1] : null
}

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [algorithm, setAlgorithm] = useState<AlgorithmInfo | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [hasAudio, setHasAudio] = useState(true)
  const [flagged, setFlagged] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadHistory = () => {
    setHistoryLoading(true)
    fetch(`${API}/history?limit=20&offset=0`)
      .then(res => res.json())
      .then((data: HistoryItem[]) => setHistory(data.filter(h => h.is_public)))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  const openDetailById = async (jobId: string) => {
    setDetailLoading(true)
    setDetailItem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const res = await fetch(`${API}/history/${jobId}`)
      if (res.ok) {
        const full: HistoryItem = await res.json()
        setDetailItem({ ...full, steps: full.steps ?? [], narration: full.narration ?? [] })
      }
    } catch {}
    finally {
      setDetailLoading(false)
    }
  }

  const openDetail = (item: HistoryItem) => {
    window.history.pushState({}, '', `/generation/${item.job_id}`)
    openDetailById(item.job_id)
  }

  const handleBack = () => {
    window.history.back()
  }

  // On mount: handle direct URL + browser back/forward
  useEffect(() => {
    loadHistory()

    const jobId = getJobIdFromPath()
    if (jobId) openDetailById(jobId)

    const onPopState = () => {
      const id = getJobIdFromPath()
      if (id) {
        openDetailById(id)
      } else {
        setDetailItem(null)
        setDetailLoading(false)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const poll = (id: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/status/${id}`)
        if (!res.ok) {
          stopPolling()
          setStatus('failed')
          setError(res.status === 404 ? 'Job not found — the server may have restarted. Please try again.' : `Server error ${res.status}`)
          return
        }
        const data = await res.json()
        setStatus(data.status)
        if (data.algorithm) setAlgorithm(data.algorithm)
        if (data.steps?.length) setSteps(data.steps)
        if (data.has_audio === false) setHasAudio(false)
        if (data.flagged) setFlagged(true)
        if (data.status === 'done') {
          stopPolling()
          const url = data.video_url?.startsWith('/')
            ? `http://127.0.0.1:8000${data.video_url}`
            : data.video_url
          setVideoUrl(url)
          loadHistory()
        } else if (data.status === 'failed') {
          stopPolling()
          setError(data.error || 'Unknown error')
        }
      } catch { /* network blip — keep polling */ }
    }, POLL_INTERVAL)
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || isRunning) return
    stopPolling()
    setStatus('pending')
    setVideoUrl(null)
    setError(null)
    setAlgorithm(null)
    setSteps([])
    setHasAudio(true)
    setFlagged(false)

    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = await res.json()
      setStatus(data.status)
      poll(data.job_id)
    } catch (e) {
      setStatus('failed')
      setError(String(e))
    }
  }

  const handleReset = () => {
    stopPolling()
    setStatus('idle')
    setVideoUrl(null)
    setError(null)
    setAlgorithm(null)
    setSteps([])
    setHasAudio(true)
  }

  const isRunning = status !== 'idle' && status !== 'done' && status !== 'failed'
  const currentStep = stepIndex(status)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col items-center px-4 py-16 gap-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Algo LightsOn💡</h1>
        <p className="text-slate-400 text-sm">Describe an algorithm — get a video explaining it.</p>
      </div>

      {/* Detail view — shown when URL is /generation/:id */}
      {(detailItem || detailLoading) ? (
        detailLoading ? (
          <div className="w-full max-w-3xl flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="h-4 w-12 bg-[#1e1e2e] rounded animate-pulse" />
              <div className="h-4 w-48 bg-[#1e1e2e] rounded animate-pulse" />
            </div>
            <div className="w-full aspect-video bg-[#13131a] border border-[#1e1e2e] rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-40 bg-[#13131a] border border-[#1e1e2e] rounded-xl animate-pulse" />
              <div className="h-40 bg-[#13131a] border border-[#1e1e2e] rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <GenerationDetail item={detailItem!} onBack={handleBack} />
        )
      ) : (
        <>
          {/* Input */}
          <div className="w-full max-w-2xl flex flex-col gap-3">
            <textarea
              className="w-full bg-[#13131a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-slate-100
                         placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-600 transition-colors"
              rows={4}
              placeholder={`Describe the algorithm in plain English, e.g.\n"MPI Reduce where 6 nodes each hold different arrays and the final sum lands on node 0"`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isRunning}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isRunning}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-600
                           text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
              >
                {isRunning ? 'Generating...' : 'Generate Video'}
              </button>
              {status !== 'idle' && (
                <button
                  onClick={handleReset}
                  className="bg-[#13131a] border border-[#1e1e2e] hover:border-slate-600 text-slate-400
                             hover:text-slate-200 rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="w-full max-w-2xl flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {STEPS.map((step, i) => {
                  const done = currentStep > i
                  const active = currentStep === i
                  return (
                    <div key={step.key} className={`flex items-center gap-3 text-sm transition-all duration-300
                      ${active ? 'text-slate-100' : done ? 'text-slate-500' : 'text-slate-700'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${active ? 'bg-indigo-600 animate-pulse' : done ? 'bg-slate-700 text-slate-400' : 'bg-[#13131a] border border-[#1e1e2e]'}`}>
                        {done ? '✓' : i + 1}
                      </span>
                      {step.label}
                    </div>
                  )
                })}
              </div>
              {(algorithm || steps.length > 0) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                  {algorithm && Object.keys(algorithm).length > 0 && <ComplexityCard info={algorithm} />}
                  {steps.length > 0 && <StepsCard steps={steps} />}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {status === 'failed' && error && (
            <div className="w-full max-w-2xl bg-red-950 border border-red-800 rounded-xl p-4 text-sm text-red-300">
              <p className="font-medium text-red-400 mb-1">Generation failed</p>
              <p className="font-mono text-xs break-all">{error}</p>
            </div>
          )}

          {/* Result */}
          {status === 'done' && (
            <div className="w-full max-w-3xl flex flex-col gap-4">
              {videoUrl && (
                <div className="flex flex-col gap-2">
                  <div className="bg-[#13131a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                    <video src={videoUrl} controls autoPlay className="w-full" />
                  </div>
                  {!hasAudio && (
                    <p className="text-xs text-amber-400 text-center">
                      Voiceover unavailable (TTS service unreachable) — narration is shown as text in the video.
                    </p>
                  )}
                  {flagged && (
                    <div className="flex items-start gap-2 bg-amber-950/50 border border-amber-700/50 rounded-lg px-3 py-2 text-xs text-amber-400">
                      <span className="mt-0.5">⚠</span>
                      <span>The narration accuracy checker could not reach 95% confidence after 4 attempts. The explanation may contain inaccuracies.</span>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {algorithm && Object.keys(algorithm).length > 0 && <ComplexityCard info={algorithm} />}
                {steps.length > 0 && <StepsCard steps={steps} />}
              </div>
              {videoUrl && (
                <a href={videoUrl} download
                   className="self-end text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Download MP4
                </a>
              )}
            </div>
          )}

          {/* Past Generations */}
          <div className="w-full max-w-3xl flex flex-col gap-4 mt-6">
            <h2 className="text-lg font-semibold text-slate-200">Past Generations</h2>
            {historyLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#13131a] border border-[#1e1e2e] rounded-xl overflow-hidden flex flex-col">
                    <div className="w-full aspect-video bg-[#0d0d14] animate-pulse" />
                    <div className="p-3 flex flex-col gap-2">
                      <div className="h-3 w-3/4 bg-[#1e1e2e] rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-[#1e1e2e] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!historyLoading && history.length === 0 && (
              <p className="text-sm text-slate-500">No past generations yet</p>
            )}
            {!historyLoading && history.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map(item => (
                  <button
                    key={item.job_id}
                    onClick={() => openDetail(item)}
                    className="bg-[#13131a] border border-[#1e1e2e] hover:border-indigo-800 rounded-xl
                               overflow-hidden flex flex-col text-left transition-colors group"
                  >
                    {/* Thumbnail */}
                    {getThumbUrl(item.video_url) ? (
                      <div className="relative w-full aspect-video overflow-hidden">
                        <img
                          src={getThumbUrl(item.video_url)!}
                          alt={item.algorithm?.name ?? 'Algorithm thumbnail'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-transparent" />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 bg-indigo-600/90 rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white ml-0.5" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-[#0d0d14] flex items-center justify-center">
                        <span className="text-3xl font-bold text-slate-700">
                          {(item.algorithm?.name ?? 'A')[0].toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Card body */}
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-bold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                            {item.algorithm?.name ?? 'Algorithm'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium self-start
                            ${item.algorithm?.execution_model === 'parallel'
                              ? 'bg-indigo-900 text-indigo-300'
                              : 'bg-slate-800 text-slate-400'}`}>
                            {item.algorithm?.execution_model === 'parallel' ? 'PARALLEL' : 'SERIAL'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
