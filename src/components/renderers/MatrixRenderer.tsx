import { useSpring, animated } from '@react-spring/three'
import type { SceneFrame } from '../../types/api'

interface MatrixRendererProps {
  frame: SceneFrame
}

const CELL_SIZE = 1.0
const GAP = 0.08

const CELL_COLORS: Record<number, string> = {
  0: '#1e1e2e',
  1: '#7f1d1d',
  2: '#1e40af',
  3: '#065f46',
  4: '#c2410c',
  5: '#6d28d9',
}

function Cell({
  value,
  row,
  col,
  rows,
  cols,
  highlighted,
}: {
  value: number
  row: number
  col: number
  rows: number
  cols: number
  highlighted: boolean
}) {
  const color = CELL_COLORS[value] ?? CELL_COLORS[0]
  const x = (col - (cols - 1) / 2) * (CELL_SIZE + GAP)
  const z = (row - (rows - 1) / 2) * (CELL_SIZE + GAP)
  const y = highlighted ? 0.12 : 0

  const { col: animColor, posY } = useSpring({
    col: color,
    posY: y,
    config: { tension: 200, friction: 20 },
  })

  return (
    <animated.mesh position-x={x} position-y={posY} position-z={z} castShadow>
      <boxGeometry args={[CELL_SIZE, 0.15, CELL_SIZE]} />
      <animated.meshStandardMaterial
        color={animColor}
        roughness={0.4}
        metalness={0.3}
        emissive={highlighted ? '#ffffff' : '#000000'}
        emissiveIntensity={highlighted ? 0.15 : 0}
      />
    </animated.mesh>
  )
}

export function MatrixRenderer({ frame }: MatrixRendererProps) {
  const grid = frame.grid_state ?? []
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  const highlightedSet = new Set(
    (frame.highlighted_cells ?? []).map(([r, c]) => `${r},${c}`)
  )

  return (
    <group rotation={[-0.3, 0, 0]}>
      {grid.map((row, r) =>
        row.map((val, c) => (
          <Cell
            key={`${r}-${c}`}
            value={val}
            row={r}
            col={c}
            rows={rows}
            cols={cols}
            highlighted={highlightedSet.has(`${r},${c}`)}
          />
        ))
      )}
    </group>
  )
}
