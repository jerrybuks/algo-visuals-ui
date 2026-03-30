import { useStore } from '../store/useStore'

export function PlaybackControls() {
  const allFrames = useStore((s) => s.allFrames)
  const currentFrameIndex = useStore((s) => s.currentFrameIndex)
  const isPlaying = useStore((s) => s.isPlaying)
  const isFetchingAudio = useStore((s) => s.isFetchingAudio)
  const audioReady = useStore((s) => s.audioReady)
  const audioError = useStore((s) => s.audioError)
  const response = useStore((s) => s.response)
  const play = useStore((s) => s.play)
  const pause = useStore((s) => s.pause)
  const seekToFrame = useStore((s) => s.seekToFrame)

  const total = allFrames.length

  // Nothing to show yet
  if (total === 0 && !isFetchingAudio) return null

  // Audio is still loading — show a prominent loader instead of controls
  if (isFetchingAudio) {
    return (
      <div className="border-t border-[#1e1e2e] bg-[#0d0d14] px-6 py-5 flex items-center justify-center gap-3">
        <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <div>
          <p className="text-sm text-slate-300 font-medium">Preparing voice narration…</p>
          <p className="text-xs text-slate-500 mt-0.5">Playback will start once all audio is loaded</p>
        </div>
      </div>
    )
  }

  const progress = total > 1 ? currentFrameIndex / (total - 1) : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    seekToFrame(Math.round(ratio * (total - 1)))
  }

  return (
    <div className="border-t border-[#1e1e2e] bg-[#0d0d14] px-6 py-4 flex flex-col gap-3">
      {/* Progress bar */}
      <div
        className="w-full h-1.5 bg-[#1e1e2e] rounded-full cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-indigo-500 rounded-full relative transition-all duration-150"
          style={{ width: `${progress * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ControlBtn onClick={() => seekToFrame(0)} title="First frame">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </ControlBtn>
          <ControlBtn onClick={() => seekToFrame(currentFrameIndex - 1)} title="Previous frame">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </ControlBtn>
          <button
            onClick={isPlaying ? pause : play}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <ControlBtn onClick={() => seekToFrame(currentFrameIndex + 1)} title="Next frame">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </ControlBtn>
          <ControlBtn onClick={() => seekToFrame(total - 1)} title="Last frame">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </ControlBtn>
        </div>

        <div className="flex items-center gap-3">
          {audioReady && (
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Audio ready
            </span>
          )}
          {audioError && !audioReady && (
            <span className="text-xs text-amber-500 flex items-center gap-1" title={audioError}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              No audio
            </span>
          )}
          <span className="text-xs text-slate-500 tabular-nums">
            {currentFrameIndex + 1} / {total}
          </span>
        </div>
      </div>
    </div>
  )
}

function ControlBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-[#1e1e2e] rounded-lg transition-colors"
    >
      {children}
    </button>
  )
}
