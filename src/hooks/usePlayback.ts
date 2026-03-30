import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

const FRAME_INTERVAL_MS = 900

export function usePlayback() {
  const isPlaying = useStore((s) => s.isPlaying)
  const currentNarrationIndex = useStore((s) => s.currentNarrationIndex)
  const audioClips = useStore((s) => s.audioClips)
  const setCurrentFrameIndex = useStore((s) => s.setCurrentFrameIndex)
  const pause = useStore((s) => s.pause)

  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const waitingForAudioRef = useRef(false)

  // ─── Unified audio effect ─────────────────────────────────────────────────
  // Handles all audio state: initial play, narration change, pause, resume.
  useEffect(() => {
    if (!isPlaying) {
      // Pause: preserve position so resume continues mid-clip
      activeAudioRef.current?.pause()
      waitingForAudioRef.current = false
      return
    }

    const clip = audioClips.get(currentNarrationIndex)
    if (!clip) return

    if (activeAudioRef.current !== clip) {
      // Different clip: narration changed or fresh play — start from the beginning
      if (activeAudioRef.current) activeAudioRef.current.pause()
      activeAudioRef.current = clip
      clip.currentTime = 0
    }

    // Resume or start the clip
    clip.play().catch((err) => {
      if (err.name !== 'NotAllowedError') console.warn('Audio playback error:', err)
    })
  }, [isPlaying, currentNarrationIndex, audioClips])

  // ─── Frame advancement ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return

    const id = setInterval(() => {
      if (waitingForAudioRef.current) return

      const { currentFrameIndex, allFrames, audioClips } = useStore.getState()

      if (currentFrameIndex >= allFrames.length - 1) {
        // Wait for the last narration clip to finish before stopping
        const lastNarration = allFrames[currentFrameIndex].narration_index
        const clip = audioClips.get(lastNarration)
        if (clip && !clip.ended && clip.readyState >= 3) {
          waitingForAudioRef.current = true
          clip.addEventListener('ended', () => {
            waitingForAudioRef.current = false
            pause()
          }, { once: true })
          return
        }
        pause()
        return
      }

      const nextIndex = currentFrameIndex + 1
      const currentNarration = allFrames[currentFrameIndex].narration_index
      const nextNarration = allFrames[nextIndex].narration_index

      // About to enter a new narration stage — wait for current audio to finish
      if (nextNarration !== currentNarration) {
        const clip = audioClips.get(currentNarration)
        if (clip && !clip.ended && clip.readyState >= 3) {
          waitingForAudioRef.current = true
          clip.addEventListener(
            'ended',
            () => {
              waitingForAudioRef.current = false
              setCurrentFrameIndex(nextIndex)
            },
            { once: true },
          )
          return
        }
      }

      setCurrentFrameIndex(nextIndex)
    }, FRAME_INTERVAL_MS)

    return () => clearInterval(id)
  }, [isPlaying, pause, setCurrentFrameIndex])
}
