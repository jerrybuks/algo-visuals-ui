import { useStore } from '../store/useStore'
import type { Scene, SceneFrame } from '../types/api'

function findCurrentSceneLabel(scenes: Scene[], currentFrame: SceneFrame | undefined): string {
  if (!currentFrame) return ''
  for (const scene of scenes) {
    if (scene.frames.some((f) => f.frame_id === currentFrame.frame_id)) {
      return scene.label
    }
  }
  return ''
}

export function StageStateOverlay() {
  const response = useStore((s) => s.response)
  const allFrames = useStore((s) => s.allFrames)
  const currentFrameIndex = useStore((s) => s.currentFrameIndex)

  const currentFrame = allFrames[currentFrameIndex]
  const scenes = response?.scene_timeline?.scenes

  if (!response || allFrames.length === 0) return null

  const sceneLabel = scenes ? findCurrentSceneLabel(scenes, currentFrame) : ''

  return (
    <aside className="w-56 shrink-0 border-r border-[#1e1e2e] bg-[#0d0d14] flex flex-col gap-2 p-4">
      <div className="bg-[#13131a] rounded-xl px-4 py-3 border border-[#1e1e2e] flex flex-col gap-1">
        {sceneLabel && <p className="text-xs text-slate-500">{sceneLabel}</p>}
        <p className="text-xs text-slate-400">
          Step <span className="text-slate-200 font-medium">{currentFrameIndex + 1}</span> /{' '}
          <span className="text-slate-200 font-medium">{allFrames.length}</span>
        </p>
        {currentFrame?.description && (
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentFrame.description}</p>
        )}
      </div>
    </aside>
  )
}
