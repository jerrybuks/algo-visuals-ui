import { useStore } from '../store/useStore'
import type { SceneFrame } from '../types/api'

export function DataStatePanel() {
  const response = useStore((s) => s.response)
  const allFrames = useStore((s) => s.allFrames)
  const currentFrameIndex = useStore((s) => s.currentFrameIndex)

  if (!response || allFrames.length === 0) return null

  const frame = allFrames[currentFrameIndex]
  const category = response.algorithm?.category

  return (
    <aside className="w-48 shrink-0 border-r border-[#1e1e2e] bg-[#0d0d14] overflow-y-auto flex flex-col gap-3 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Data State</p>

      {frame.type === 'init' && (
        <p className="text-xs text-slate-600 italic">Initial input</p>
      )}
      {frame.type === 'result' && (
        <p className="text-xs text-emerald-500 font-medium">Final result</p>
      )}

      {category === 'array' && <ArrayState frame={frame} />}
      {category === 'tree' && <TreeState frame={frame} />}
      {category === 'graph' && <GraphState frame={frame} />}
      {category === 'matrix' && <MatrixState frame={frame} />}
    </aside>
  )
}

// ─── Array ────────────────────────────────────────────────────────────────────

function ArrayState({ frame }: { frame: SceneFrame }) {
  const arr = frame.array_state ?? []
  const highlights = new Set(frame.highlight_indices ?? [])

  if (arr.length === 0) return <p className="text-xs text-slate-600">No array data</p>

  return (
    <div className="flex flex-col gap-0.5">
      {arr.map((val, i) => {
        const isHighlighted = highlights.has(i)
        return (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono transition-colors duration-200
              ${isHighlighted
                ? 'bg-yellow-900/50 border border-yellow-700/50 text-yellow-300'
                : 'bg-[#13131a] text-slate-300'
              }`}
          >
            <span className="text-slate-600 w-5 text-right shrink-0">{i}</span>
            <span className="flex-1 text-right">{String(val)}</span>
            {isHighlighted && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tree ─────────────────────────────────────────────────────────────────────

function TreeState({ frame }: { frame: SceneFrame }) {
  const nodes = frame.node_states ?? {}
  const highlighted = new Set(frame.highlighted_nodes ?? [])
  const entries = Object.entries(nodes)

  if (entries.length === 0) return <p className="text-xs text-slate-600">No tree data</p>

  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([id, state]) => {
        const isHighlighted = highlighted.has(id)
        const isVisited = state.visited
        return (
          <div
            key={id}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors duration-200
              ${isHighlighted
                ? 'bg-yellow-900/50 border border-yellow-700/50 text-yellow-300'
                : isVisited
                ? 'bg-green-900/30 text-green-300'
                : 'bg-[#13131a] text-slate-400'
              }`}
          >
            <span className="text-slate-500 shrink-0">node {id}</span>
            <span className="font-mono font-medium ml-2">{String(state.value ?? '—')}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Graph ────────────────────────────────────────────────────────────────────

function GraphState({ frame }: { frame: SceneFrame }) {
  const nodes = frame.node_states ?? {}
  const highlighted = new Set(frame.highlighted_nodes ?? [])
  const entries = Object.entries(nodes)

  if (entries.length === 0) return <p className="text-xs text-slate-600">No graph data</p>

  const hasDistances = entries.some(([, s]) => s.distance !== undefined && s.distance !== null)

  return (
    <div className="flex flex-col gap-0.5">
      {hasDistances && (
        <div className="flex justify-between text-[10px] text-slate-600 px-2 mb-1">
          <span>node</span>
          <span>dist</span>
        </div>
      )}
      {entries.map(([id, state]) => {
        const isHighlighted = highlighted.has(id)
        const isVisited = state.visited
        return (
          <div
            key={id}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors duration-200
              ${isHighlighted
                ? 'bg-yellow-900/50 border border-yellow-700/50 text-yellow-300'
                : isVisited
                ? 'bg-green-900/30 text-green-300'
                : 'bg-[#13131a] text-slate-400'
              }`}
          >
            <span className="font-medium">{id}</span>
            {hasDistances && (
              <span className="font-mono text-indigo-300 text-[10px]">
                {state.distance !== undefined && state.distance !== null ? String(state.distance) : '∞'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Matrix ───────────────────────────────────────────────────────────────────

const CELL_COLORS: Record<number, string> = {
  0: 'bg-[#1e1e2e]',
  1: 'bg-red-900',
  2: 'bg-blue-800',
  3: 'bg-green-700',
  4: 'bg-orange-600',
  5: 'bg-purple-600',
}

function MatrixState({ frame }: { frame: SceneFrame }) {
  const grid = frame.grid_state ?? []
  const highlightedSet = new Set((frame.highlighted_cells ?? []).map(([r, c]) => `${r},${c}`))
  const pathSet = new Set((frame.path_cells ?? []).map(([r, c]) => `${r},${c}`))

  if (grid.length === 0) return <p className="text-xs text-slate-600">No grid data</p>

  // Scale cell size so the grid fits comfortably in the 160px-wide panel
  const cols = grid[0]?.length ?? 1
  const cellSize = Math.min(18, Math.floor(152 / cols))

  return (
    <div className="flex flex-col gap-0.5">
      {grid.map((row, r) => (
        <div key={r} className="flex gap-0.5">
          {row.map((val, c) => {
            const key = `${r},${c}`
            const isHighlighted = highlightedSet.has(key)
            const isPath = pathSet.has(key)
            const base = isHighlighted
              ? 'bg-yellow-400'
              : isPath
              ? 'bg-green-500'
              : (CELL_COLORS[val as number] ?? 'bg-[#1e1e2e]')
            return (
              <div
                key={c}
                style={{ width: cellSize, height: cellSize }}
                className={`rounded-sm ${base} transition-colors duration-200`}
              />
            )
          })}
        </div>
      ))}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {[
          { color: 'bg-[#1e1e2e]', label: 'open' },
          { color: 'bg-red-900', label: 'wall' },
          { color: 'bg-blue-800', label: 'visited' },
          { color: 'bg-green-500', label: 'path' },
          { color: 'bg-orange-600', label: 'start' },
          { color: 'bg-purple-600', label: 'end' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[10px] text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
