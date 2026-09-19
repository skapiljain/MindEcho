import { api } from './client'

export interface SubConceptScore {
  name: string
  covered: boolean
  score: number
}

export interface RetentionImpact {
  intervalDays: number
  reason: string
}

export interface PracticeQuestion {
  id: string
  question: string
  score?: number
  adopted: boolean
  source: 'ai' | 'user'
  lastAnsweredAt?: string
}

export interface FeynmanEvaluationResponse {
  evaluationId: string
  noteId: string
  lectorScore: number
  correctness: number
  clarity: number
  completeness: number
  transcript?: string
  feedback: {
    strengths: string[]
    missingConcepts: string[]
    improvementTip: string
  }
  subConcepts: SubConceptScore[]
  misconceptions: string[]
  nextPrompt: string
  retentionImpact: RetentionImpact
  answeredQuestionId?: string
  practiceQuestions: PracticeQuestion[]
  updatedNoteState: {
    practiceCount: number
    lastPracticed: string
    retentionHealth: number
    nextReviewDate: string
  }
}

export interface EvaluationDetail {
  id: string
  noteId: string
  mode: 'voice' | 'text'
  lectorScore: number
  correctness: number
  clarity: number
  completeness: number
  transcript?: string
  feedback: FeynmanEvaluationResponse['feedback']
  subConcepts: SubConceptScore[]
  misconceptions: string[]
  nextPrompt?: string
  retentionImpact?: RetentionImpact
  audioUrl?: string
  createdAt: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export async function submitTextEvaluation(input: {
  noteId: string
  explanationText: string
  selfRating?: number
  questionId?: string
}): Promise<FeynmanEvaluationResponse> {
  return api<FeynmanEvaluationResponse>('/evaluations/feynman', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function submitVoiceEvaluation(input: {
  noteId: string
  audioBlob: Blob
  selfRating?: number
  questionId?: string
}): Promise<FeynmanEvaluationResponse> {
  const token = localStorage.getItem('memoroute_token')

  const formData = new FormData()
  formData.append('noteId', input.noteId)
  if (input.questionId) formData.append('questionId', input.questionId)
  formData.append('audioFile', input.audioBlob, 'explanation.webm')
  if (input.selfRating != null) {
    formData.append('selfRating', String(input.selfRating))
  }

  const response = await fetch(`${API_BASE}/evaluations/feynman`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof data?.error?.message === 'string' ? data.error.message : 'Evaluation failed'
    throw new Error(message)
  }

  return data as FeynmanEvaluationResponse
}

export async function listEvaluations(): Promise<EvaluationDetail[]> {
  return api<EvaluationDetail[]>('/evaluations')
}

export function getEvaluationAudioUrl(evaluationId: string): string {
  return `${API_BASE}/evaluations/${evaluationId}/audio`
}

export async function fetchEvaluationAudioObjectUrl(evaluationId: string): Promise<string> {
  const token = localStorage.getItem('memoroute_token')
  const response = await fetch(getEvaluationAudioUrl(evaluationId), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error('Failed to load evaluation audio')
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
