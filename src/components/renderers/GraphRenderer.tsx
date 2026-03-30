import { useMemo } from 'react'
import { Text, Line } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import type { SceneFrame } from '../../types/api'

interface GraphRendererProps {
  frame: SceneFrame
}

function nodeColor(nodeId: string, frame: SceneFrame): string {
  const state = frame.node_states?.[nodeId]
  if (frame.highlighted_nodes?.includes(nodeId)) return '#fbbf24'
  if (state?.active) return '#f59e0b'
  if (state?.visited) return '#10b981'
  return '#4f46e5'
}

function GraphNode({
  id,
  x,
  y,
  frame,
}: {
  id: string
  x: number
  y: number
  frame: SceneFrame
}) {
  const color = nodeColor(id, frame)
  const { col } = useSpring({ col: color, config: { tension: 180, friction: 18 } })
  const state = (frame.node_states?.[id] ?? {}) as Record<string, unknown>
  const label = state['distance'] !== undefined ? `${id}\n${state['distance']}` : id

  return (
    <group position={[x, y, 0]}>
      <animated.mesh>
        <sphereGeometry args={[0.4, 24, 24]} />
        <animated.meshStandardMaterial color={col} roughness={0.3} metalness={0.5} />
      </animated.mesh>
      <Text position={[0, 0.65, 0]} fontSize={0.28} color="#f1f5f9" anchorX="center" anchorY="middle">
        {id}
      </Text>
    </group>
  )
}
// fix reference
function GraphNodeFixed({ id, x, y, frame }: { id: string; x: number; y: number; frame: SceneFrame }) {
  const color = nodeColor(id, frame)
  const { col } = useSpring({ col: color, config: { tension: 180, friction: 18 } })
  const state = frame.node_states?.[id]
  const distLabel = state?.distance !== undefined ? ` (${state.distance})` : ''

  return (
    <group position={[x, y, 0]}>
      <animated.mesh>
        <sphereGeometry args={[0.4, 24, 24]} />
        <animated.meshStandardMaterial color={col} roughness={0.3} metalness={0.5} />
      </animated.mesh>
      <Text position={[0, 0.7, 0]} fontSize={0.28} color="#f1f5f9" anchorX="center" anchorY="middle">
        {id + distLabel}
      </Text>
    </group>
  )
}

export function GraphRenderer({ frame }: GraphRendererProps) {
  const graphState = frame.graph_state
  const nodes: string[] = graphState?.nodes ?? Object.keys(frame.node_states ?? {})
  const edges = graphState?.edges ?? []

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    const count = nodes.length
    const radius = Math.max(2.5, count * 0.6)
    nodes.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      map.set(id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) })
    })
    return map
  }, [nodes.join(',')])

  const highlightedEdgeSet = new Set(
    (frame.highlighted_edges ?? []).map((e) => `${e.from_node}-${e.to_node}`)
  )

  return (
    <group>
      {/* Edges */}
      {edges.map((edge, i) => {
        const from = positions.get(String(edge.from))
        const to = positions.get(String(edge.to))
        if (!from || !to) return null
        const key = `${edge.from}-${edge.to}`
        const isHighlighted = highlightedEdgeSet.has(key)
        return (
          <Line
            key={i}
            points={[
              [from.x, from.y, 0],
              [to.x, to.y, 0],
            ]}
            color={isHighlighted ? '#fbbf24' : '#2d2d4e'}
            lineWidth={isHighlighted ? 2.5 : 1}
          />
        )
      })}
      {/* Nodes */}
      {nodes.map((id) => {
        const pos = positions.get(id)
        if (!pos) return null
        return <GraphNodeFixed key={id} id={id} x={pos.x} y={pos.y} frame={frame} />
      })}
    </group>
  )
}
