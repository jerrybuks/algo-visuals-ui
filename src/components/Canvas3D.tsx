import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { ArrayRenderer } from './renderers/ArrayRenderer'
import { TreeRenderer } from './renderers/TreeRenderer'
import { GraphRenderer } from './renderers/GraphRenderer'
import { MatrixRenderer } from './renderers/MatrixRenderer'

function SceneContent() {
  const response = useStore((s) => s.response)
  const allFrames = useStore((s) => s.allFrames)
  const currentFrameIndex = useStore((s) => s.currentFrameIndex)
  const isGenerating = useStore((s) => s.isGenerating)

  const currentFrame = allFrames[currentFrameIndex]
  const category = response?.algorithm?.category

  if (isGenerating) {
    return (
      <Text fontSize={0.5} color="#6366f1" anchorX="center" anchorY="middle">
        Generating...
      </Text>
    )
  }

  if (!response || !currentFrame) {
    return (
      <group>
        <Text fontSize={0.45} color="#475569" anchorX="center" anchorY="middle" position={[0, 0.3, 0]}>
          Enter a prompt to begin
        </Text>
        <Text fontSize={0.28} color="#334155" anchorX="center" anchorY="middle" position={[0, -0.4, 0]}>
          e.g. "Parallel BFS" or "Merge sort an array"
        </Text>
      </group>
    )
  }

  return (
    <>
      {category === 'array' && <ArrayRenderer frame={currentFrame} />}
      {category === 'tree' && <TreeRenderer frame={currentFrame} />}
      {category === 'graph' && <GraphRenderer frame={currentFrame} />}
      {category === 'matrix' && <MatrixRenderer frame={currentFrame} />}
    </>
  )
}

export function Canvas3D() {
  return (
    <div className="flex-1 relative overflow-hidden">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#6366f1" />
        <pointLight position={[0, 8, 0]} intensity={0.6} color="#a5b4fc" />

        <Grid
          position={[0, -3, 0]}
          args={[30, 30]}
          cellSize={1}
          cellThickness={0.4}
          cellColor="#1e1e2e"
          sectionSize={5}
          sectionThickness={0.8}
          sectionColor="#2d2d4e"
          fadeDistance={25}
          fadeStrength={1}
        />

        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={30}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
