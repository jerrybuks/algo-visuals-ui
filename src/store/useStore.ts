import { create } from 'zustand'
import { generateAlgorithm, generateTTS } from '../api/client'
import type { GenerateResponse, SceneFrame } from '../types/api'

interface AppState {
  prompt: string
  setPrompt: (p: string) => void

  isGenerating: boolean
  isFetchingAudio: boolean
  audioReady: boolean
  audioError: string | null
  error: string | null

  response: GenerateResponse | null
  audioClips: Map<number, HTMLAudioElement>

  allFrames: SceneFrame[]
  isPlaying: boolean
  currentFrameIndex: number
  currentNarrationIndex: number

  generate: (prompt: string) => Promise<void>
  play: () => void
  pause: () => void
  seekToFrame: (index: number) => void
  reset: () => void
  setCurrentFrameIndex: (index: number) => void
}

function base64ToAudio(b64: string): HTMLAudioElement {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.preload = 'auto'
  return audio
}

function waitForAudioLoad(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    if (audio.readyState >= 3) {
      resolve()
      return
    }
    const onReady = () => resolve()
    audio.addEventListener('canplaythrough', onReady, { once: true })
    // Safety timeout — don't hang forever
    setTimeout(resolve, 8000)
  })
}

export const useStore = create<AppState>((set, get) => ({
  prompt: '',
  setPrompt: (p) => set({ prompt: p }),

  isGenerating: false,
  isFetchingAudio: false,
  audioReady: false,
  audioError: null,
  error: null,

  response: null,
  audioClips: new Map(),

  allFrames: [],
  isPlaying: false,
  currentFrameIndex: 0,
  currentNarrationIndex: 0,

  generate: async (prompt: string) => {
    set({
      isGenerating: true,
      error: null,
      audioError: null,
      response: null,
      allFrames: [],
      audioClips: new Map(),
      audioReady: false,
      currentFrameIndex: 0,
      currentNarrationIndex: 0,
      isPlaying: false,
    })

    let response: GenerateResponse
    try {
      response = await generateAlgorithm(prompt)
    } catch (e) {
      set({ isGenerating: false, error: (e as Error).message })
      return
    }

    if (response.status === 'failed') {
      const errorMsg = response.errors?.length
        ? response.errors[response.errors.length - 1]
        : 'Algorithm generation failed'
      set({ isGenerating: false, isFetchingAudio: false, error: errorMsg, response })
      return
    }

    const allFrames: SceneFrame[] = response.scene_timeline
      ? response.scene_timeline.scenes.flatMap((s) => s.frames)
      : []

    set({ isGenerating: false, response, allFrames, isFetchingAudio: true })

    if (response.narration.length > 0) {
      try {
        const ttsResponse = await generateTTS(response.narration)

        // Decode all clips
        const clips = new Map<number, HTMLAudioElement>()
        for (const clip of ttsResponse.clips) {
          clips.set(clip.narration_index, base64ToAudio(clip.audio_b64))
        }

        // Trigger browser loading
        clips.forEach((audio) => audio.load())

        // Wait for every clip to be ready before showing controls
        await Promise.all(Array.from(clips.values()).map(waitForAudioLoad))

        set({ audioClips: clips, audioReady: true })
      } catch (e) {
        // TTS failed — animation still works, show a soft warning
        console.error('TTS failed:', e)
        set({ audioError: (e as Error).message ?? 'Audio generation failed' })
      }
    }

    set({ isFetchingAudio: false })
  },

  play: () => {
    const { allFrames, currentFrameIndex } = get()
    if (allFrames.length === 0) return
    if (currentFrameIndex >= allFrames.length - 1) {
      set({ currentFrameIndex: 0, currentNarrationIndex: 0 })
    }
    set({ isPlaying: true })
  },

  pause: () => set({ isPlaying: false }),

  seekToFrame: (index: number) => {
    const { allFrames } = get()
    const clamped = Math.max(0, Math.min(index, allFrames.length - 1))
    const frame = allFrames[clamped]
    set({ currentFrameIndex: clamped, currentNarrationIndex: frame?.narration_index ?? 0 })
  },

  setCurrentFrameIndex: (index: number) => {
    const { allFrames } = get()
    const frame = allFrames[index]
    set({ currentFrameIndex: index, currentNarrationIndex: frame?.narration_index ?? 0 })
  },

  reset: () =>
    set({
      response: null,
      allFrames: [],
      audioClips: new Map(),
      audioReady: false,
      audioError: null,
      currentFrameIndex: 0,
      currentNarrationIndex: 0,
      isPlaying: false,
      error: null,
    }),
}))
