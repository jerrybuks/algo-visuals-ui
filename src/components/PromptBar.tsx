import { useState } from 'react'
import { useStore } from '../store/useStore'

export function PromptBar() {
  const [value, setValue] = useState('')
  const isGenerating = useStore((s) => s.isGenerating)
  const isFetchingAudio = useStore((s) => s.isFetchingAudio)
  const generate = useStore((s) => s.generate)
  const setPrompt = useStore((s) => s.setPrompt)

  const busy = isGenerating || isFetchingAudio

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || busy) return
    setPrompt(value)
    generate(value)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-3 px-6 py-4 border-b border-[#1e1e2e] bg-[#0d0d14]"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe an algorithm... e.g. 'Parallel BFS on a graph' or 'Merge sort an array'"
        disabled={busy}
        className="flex-1 bg-[#13131a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0"
      >
        {isGenerating ? (
          <>
            <Spinner />
            Generating...
          </>
        ) : isFetchingAudio ? (
          <>
            <Spinner />
            Preparing audio...
          </>
        ) : (
          'Generate'
        )}
      </button>
    </form>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
