import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import type { SceneFrame } from '../../types/api'

const DEFAULT_COLOR = '#4f46e5'
const HIGHLIGHT_COLOR = '#fbbf24'
const MAX_HEIGHT = 4   // tallest bar in world units
const MAX_WIDTH = 9    // total array width budget (fits camera fov=50 at z=12)

interface ArrayRendererProps {
  frame: SceneFrame
}

function ArrayBar({
  value,
  index,
  total,
  maxVal,
  highlighted,
}: {
  value: unknown
  index: number
  total: number
  maxVal: number
  highlighted: boolean
}) {
  const numVal = typeof value === 'number' ? value : 1
  const height = Math.max(0.3, (numVal / maxVal) * MAX_HEIGHT)

  // Shrink spacing + bar width for large arrays so everything stays on screen
  const spacing = total <= 1 ? 1.4 : Math.min(1.4, MAX_WIDTH / (total - 1))
  const barWidth = Math.min(1, spacing * 0.72)
  const x = (index - (total - 1) / 2) * spacing

  const { color, scaleY, posY } = useSpring({
    color: highlighted ? HIGHLIGHT_COLOR : DEFAULT_COLOR,
    scaleY: highlighted ? 1.1 : 1,
    posY: height / 2,
    config: { tension: 200, friction: 20 },
  })

  return (
    <animated.group position-x={x} position-y={posY} scale-y={scaleY}>
      <animated.mesh>
        <boxGeometry args={[barWidth, height, 1]} />
        <animated.meshStandardMaterial color={color} roughness={0.3} metalness={0.4} emissive={highlighted ? '#7c5c00' : '#000000'} emissiveIntensity={highlighted ? 0.3 : 0} />
      </animated.mesh>
      <Text
        position={[0, height / 2 + 0.4, 0]}
        fontSize={Math.min(0.35, barWidth * 0.45)}
        color="#f1f5f9"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
    </animated.group>
  )
}

export function ArrayRenderer({ frame }: ArrayRendererProps) {
  const arr = frame.array_state ?? []
  const highlights = new Set(frame.highlight_indices ?? [])
  const n = arr.length

  const maxVal = Math.max(
    1,
    ...arr.map((v) => (typeof v === 'number' ? Math.abs(v) : 1)),
  )
  const spacing = n <= 1 ? 1.4 : Math.min(1.4, MAX_WIDTH / (n - 1))

  return (
    <group position={[0, -1, 0]}>
      {arr.map((val, i) => (
        <ArrayBar
          key={i}
          value={val}
          index={i}
          total={n}
          maxVal={maxVal}
          highlighted={highlights.has(i)}
        />
      ))}
      {/* Active connections as arcs */}
      {(frame.active_connections ?? []).map((conn, i) => {
        const x1 = (conn.from_index - (n - 1) / 2) * spacing
        const x2 = (conn.to_index - (n - 1) / 2) * spacing
        const midX = (x1 + x2) / 2
        const arcHeight = Math.abs(x2 - x1) * 0.5 + 1
        return (
          <ArcLine key={i} x1={x1} x2={x2} midX={midX} arcHeight={arcHeight} />
        )
      })}
    </group>
  )
}

function ArcLine({ x1, x2, midX, arcHeight }: { x1: number; x2: number; midX: number; arcHeight: number }) {
  const points: [number, number, number][] = []
  const steps = 20
  for (let t = 0; t <= steps; t++) {
    const u = t / steps
    const x = x1 + (x2 - x1) * u
    const y = 4 * arcHeight * u * (1 - u)
    points.push([x, y + 2, 0])
  }

  const meshRef = useRef<THREE.LineSegments>(null!)
  useFrame(() => {})

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flat()), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#fbbf24" linewidth={2} />
    </line>
  )
}
