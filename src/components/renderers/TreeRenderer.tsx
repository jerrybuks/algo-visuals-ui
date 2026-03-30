import { Text, Line } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import type { SceneFrame, NodeState } from '../../types/api'

interface TreeRendererProps {
  frame: SceneFrame
}

interface NodePosition {
  id: string
  x: number
  y: number
  state: NodeState
}

function computeLayout(
  nodeStates: Record<string, NodeState>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Find root (node with no parent)
  const root = Object.entries(nodeStates).find(([, s]) => !s.parent)?.[0]
  if (!root) return positions

  const H_SPREAD = 2.0
  const V_SPACING = 1.8

  function layout(nodeId: string, depth: number, leftBound: number, rightBound: number) {
    const midX = (leftBound + rightBound) / 2
    positions.set(nodeId, { x: midX, y: -depth * V_SPACING })
    const children = nodeStates[nodeId]?.children ?? []
    if (children.length === 0) return
    const segWidth = (rightBound - leftBound) / children.length
    children.forEach((child, i) => {
      layout(child, depth + 1, leftBound + i * segWidth, leftBound + (i + 1) * segWidth)
    })
  }

  // Compute tree width
  const totalNodes = Object.keys(nodeStates).length
  const treeWidth = Math.max(totalNodes * H_SPREAD, 6)
  layout(root, 0, -treeWidth / 2, treeWidth / 2)
  return positions
}

function TreeNode({
  id,
  x,
  y,
  state,
  highlighted,
}: {
  id: string
  x: number
  y: number
  state: NodeState
  highlighted: boolean
}) {
  const active = state.active ?? false
  const visited = state.visited

  const targetColor = highlighted
    ? '#fbbf24'
    : active
    ? '#f59e0b'
    : visited
    ? '#10b981'
    : '#4f46e5'

  const { color } = useSpring({
    color: targetColor,
    config: { tension: 180, friction: 18 },
  })

  return (
    <group position={[x, y, 0]}>
      <animated.mesh>
        <sphereGeometry args={[0.35, 24, 24]} />
        <animated.meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.5}
          emissive={highlighted ? '#7c5c00' : '#000'}
          emissiveIntensity={highlighted ? 0.4 : 0}
        />
      </animated.mesh>
      <Text position={[0, 0.6, 0]} fontSize={0.3} color="#f1f5f9" anchorX="center" anchorY="middle">
        {String(state.value ?? id)}
      </Text>
    </group>
  )
}

export function TreeRenderer({ frame }: TreeRendererProps) {
  const nodeStates = frame.node_states ?? {}
  const highlighted = new Set(frame.highlighted_nodes ?? [])
  const highlightedEdges = frame.highlighted_edges ?? []

  const positions = computeLayout(nodeStates)

  const edgeSet = new Set(highlightedEdges.map((e) => `${e.from_node}-${e.to_node}`))

  return (
    <group position={[0, 1, 0]}>
      {/* Edges */}
      {Object.entries(nodeStates).map(([id, state]) =>
        (state.children ?? []).map((childId) => {
          const from = positions.get(id)
          const to = positions.get(childId)
          if (!from || !to) return null
          const isHighlighted = edgeSet.has(`${id}-${childId}`)
          return (
            <Line
              key={`${id}-${childId}`}
              points={[
                [from.x, from.y, 0],
                [to.x, to.y, 0],
              ]}
              color={isHighlighted ? '#fbbf24' : '#2d2d4e'}
              lineWidth={isHighlighted ? 2.5 : 1.5}
            />
          )
        })
      )}
      {/* Nodes */}
      {Array.from(positions.entries()).map(([id, pos]) => (
        <TreeNode
          key={id}
          id={id}
          x={pos.x}
          y={pos.y}
          state={nodeStates[id]}
          highlighted={highlighted.has(id)}
        />
      ))}
    </group>
  )
}
