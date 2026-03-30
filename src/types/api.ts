export interface Complexity {
  time?: string
  space?: string
  work?: string
  span?: string
}

export interface AlgorithmInfo {
  name: string
  type: string
  execution_model: 'serial' | 'parallel'
  category: 'array' | 'tree' | 'graph' | 'matrix'
  subtype: string
  complexity: Complexity
  input_size: number
  description: string
  steps: string[]  // ordered high-level implementation steps
}

export interface ValidationCheck {
  name: string
  passed: boolean
  message?: string | null
}

export interface ValidationResult {
  passed: boolean
  checks: ValidationCheck[]
}

export interface ResponseMeta {
  ai_model: string
  generation_time_ms: number
  execution_time_ms: number
}

export interface Connection {
  from_index: number
  to_index: number
  label: string
}

export interface EdgeHighlight {
  from_node: string
  to_node: string
  label: string
}

export interface NodeState {
  value: unknown
  visited: boolean
  parent?: string
  children?: string[]
  distance?: number
  active?: boolean
}

export interface GraphState {
  nodes: string[]
  edges: { from: string; to: string; weight?: number }[]
  visited: string[]
  distances: Record<string, unknown>
  parent_map?: Record<string, string>
}

export interface SceneFrame {
  frame_id: number
  type: 'init' | 'operation' | 'result'
  step_ref?: number
  narration_index: number
  description: string
  // Array
  array_state?: unknown[]
  highlight_indices?: number[]
  active_connections?: Connection[]
  value_labels?: Record<string, string>
  // Tree / Graph
  highlighted_nodes?: string[]
  highlighted_edges?: EdgeHighlight[]
  node_states?: Record<string, NodeState>
  graph_state?: GraphState
  // Matrix
  grid_state?: number[][]
  highlighted_cells?: [number, number][]
  path_cells?: [number, number][]
}

export interface Scene {
  scene_id: number
  label: string
  frames: SceneFrame[]
}

export interface SceneTimeline {
  algorithm_name: string
  algorithm_category: string
  algorithm_subtype: string
  total_frames: number
  duration_hint_ms: number
  input: unknown
  scenes: Scene[]
}

export interface TraceStep {
  step_id: number
  stage: number
  operation: string
  description: string
  parallel_group: number
  [key: string]: unknown
}

export interface StepTrace {
  algorithm_name: string
  algorithm_category: string
  algorithm_subtype: string
  total_steps: number
  stages: number
  input: unknown
  final_output: unknown
  steps: TraceStep[]
}

export interface GenerateResponse {
  request_id: string
  status: 'success' | 'partial' | 'failed'
  confidence_score: number
  algorithm: AlgorithmInfo | null
  code: string | null
  narration: string[]
  step_indices: number[]  // per-stage mapping into algorithm.steps (starts at narration[3])
  trace: StepTrace | null
  scene_timeline: SceneTimeline | null
  validation: ValidationResult | null
  errors: string[]
  meta: ResponseMeta
}

export interface GenerateRequest {
  prompt: string
  input_data?: unknown
}

export interface AudioClip {
  narration_index: number
  audio_b64: string
  format: string
}

export type ElevenLabsVoice = 'Rachel' | 'Domi' | 'Bella' | 'Antoni' | 'Josh' | 'Arnold' | 'Adam' | 'Sam'

export interface TTSRequest {
  sentences: string[]
  voice?: ElevenLabsVoice
}

export interface TTSResponse {
  clips: AudioClip[]
  voice: string
  model: string
}
