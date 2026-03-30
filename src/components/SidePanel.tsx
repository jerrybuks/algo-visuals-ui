import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

const CATEGORY_COLOURS: Record<string, string> = {
  array: 'bg-blue-900 text-blue-300',
  tree: 'bg-green-900 text-green-300',
  graph: 'bg-purple-900 text-purple-300',
  matrix: 'bg-orange-900 text-orange-300',
}

function confidenceColour(score: number) {
  if (score >= 0.8) return 'text-emerald-400'
  if (score >= 0.5) return 'text-yellow-400'
  return 'text-red-400'
}

export function SidePanel() {
  const response = useStore((s) => s.response)
  const currentNarrationIndex = useStore((s) => s.currentNarrationIndex)

  const [visibleNarration, setVisibleNarration] = useState('')
  const [narrationKey, setNarrationKey] = useState(0)

  const narrationText = response?.narration[currentNarrationIndex] ?? ''

  useEffect(() => {
    setVisibleNarration(narrationText)
    setNarrationKey((k) => k + 1)
  }, [narrationText])

  if (!response) {
    return (
      <aside className="w-80 shrink-0 border-l border-[#1e1e2e] bg-[#0d0d14] flex items-center justify-center p-6">
        <p className="text-slate-500 text-sm text-center">Algorithm details will appear here after generation.</p>
      </aside>
    )
  }

  const { algorithm, confidence_score, validation, errors, step_indices } = response

  const STAGE_NARRATION_START = 3
  const totalStages = step_indices?.length ?? 0
  const lastNarrationIdx = STAGE_NARRATION_START + totalStages
  let activeStepIndex: number | null = null
  if (currentNarrationIndex >= STAGE_NARRATION_START && currentNarrationIndex < lastNarrationIdx) {
    activeStepIndex = step_indices?.[currentNarrationIndex - STAGE_NARRATION_START] ?? null
  } else if (currentNarrationIndex >= lastNarrationIdx && (algorithm?.steps?.length ?? 0) > 0) {
    activeStepIndex = (algorithm!.steps.length) - 1
  }

  return (
    <aside className="w-80 shrink-0 border-l border-[#1e1e2e] bg-[#0d0d14] overflow-y-auto flex flex-col gap-5 p-5">
      {algorithm && (
        <>
          {/* Name + badges */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-slate-100 leading-tight">{algorithm.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOURS[algorithm.category] ?? 'bg-slate-800 text-slate-300'}`}>
                {algorithm.category}
              </span>
              {algorithm.subtype && algorithm.subtype !== 'default' && algorithm.subtype !== 'none' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {algorithm.subtype}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold tracking-wide ${algorithm.execution_model === 'parallel' ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                {algorithm.execution_model.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Algorithm Steps */}
          {algorithm.steps && algorithm.steps.length > 0 && (
            <div className="bg-[#13131a] rounded-xl p-4 border border-[#1e1e2e]">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Algorithm Steps</p>
              <ol className="flex flex-col gap-1.5">
                {algorithm.steps.map((step, i) => {
                  const isActive = activeStepIndex === i
                  const isDone = activeStepIndex !== null && i < activeStepIndex
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-300
                        ${isActive ? 'bg-indigo-950/70 border border-indigo-700/50 text-slate-100' :
                          isDone  ? 'text-slate-500' : 'text-slate-600'}`}
                    >
                      <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0
                        ${isActive ? 'bg-indigo-500 text-white' :
                          isDone  ? 'bg-slate-700 text-slate-400' : 'bg-[#1e1e2e] text-slate-600'}`}>
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span className={`leading-snug ${isActive ? 'font-medium' : ''}`}>{step}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* Complexity */}
          <div className="bg-[#13131a] rounded-xl p-4 border border-[#1e1e2e]">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Complexity</p>
            {algorithm.execution_model === 'parallel' ? (
              <div className="flex flex-col gap-2">
                <ComplexityRow label="Work" value={algorithm.complexity.work} />
                <ComplexityRow label="Span" value={algorithm.complexity.span} />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <ComplexityRow label="Time" value={algorithm.complexity.time} />
                <ComplexityRow label="Space" value={algorithm.complexity.space} />
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between bg-[#13131a] rounded-xl px-4 py-3 border border-[#1e1e2e]">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Confidence</span>
            <span className={`text-lg font-bold ${confidenceColour(confidence_score)}`}>
              {Math.round(confidence_score * 100)}%
            </span>
          </div>
        </>
      )}

      {/* Narration */}
      {visibleNarration && (
        <div className="bg-[#13131a] rounded-xl p-4 border border-[#1e1e2e]">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Narration</p>
          <p
            key={narrationKey}
            className="text-sm text-slate-200 italic leading-relaxed animate-fade-in"
          >
            {visibleNarration}
          </p>
        </div>
      )}

      {/* Validation */}
      {validation && (
        <div className="bg-[#13131a] rounded-xl p-4 border border-[#1e1e2e]">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Validation</p>
          <div className="flex flex-col gap-2">
            {validation.checks.map((check) => (
              <div key={check.name} className="flex items-start gap-2">
                <span className={`mt-0.5 text-sm ${check.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-xs text-slate-300 font-medium">{check.name.replace(/_/g, ' ')}</p>
                  {check.message && <p className="text-xs text-slate-500 mt-0.5">{check.message}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-950 rounded-xl p-4 border border-red-900">
          <p className="text-xs text-red-400 uppercase tracking-wider mb-2 font-medium">Errors</p>
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-300">{e}</p>
          ))}
        </div>
      )}
    </aside>
  )
}

function ComplexityRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-mono font-medium text-indigo-300">{value ?? '—'}</span>
    </div>
  )
}
