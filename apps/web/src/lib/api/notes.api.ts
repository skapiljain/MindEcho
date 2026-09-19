import type { NoteItem } from '../../context/NotesContext'
import { api } from './client'

export type CreateNoteInput = Omit<
  NoteItem,
  'id' | 'createdAt' | 'updatedAt' | 'practiceCount' | 'retentionHealth'
>

export type UpdateNoteInput = Partial<
  Pick<
    NoteItem,
    | 'title'
    | 'subject'
    | 'icon'
    | 'content'
    | 'lectorScore'
    | 'practiceCount'
    | 'lastPracticed'
    | 'retentionHealth'
    | 'nextReviewDate'
  >
>

export async function fetchNotes(params?: {
  subject?: string
  search?: string
  searchMode?: 'text' | 'semantic'
}): Promise<NoteItem[]> {
  const query = new URLSearchParams()
  if (params?.subject) query.set('subject', params.subject)
  if (params?.search) query.set('search', params.search)
  if (params?.searchMode) query.set('searchMode', params.searchMode)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return api<NoteItem[]>(`/notes${suffix}`)
}

export async function reindexNoteEmbeddings(): Promise<{ success: boolean; updated: number }> {
  return api<{ success: boolean; updated: number }>('/notes/reindex-embeddings', {
    method: 'POST',
  })
}

export type PracticeQuestion = {
  id: string
  question: string
  score?: number
  adopted: boolean
  source: 'ai' | 'user'
  lastAnsweredAt?: string
}

export async function generatePracticeQuestions(
  noteId: string,
  options?: { count?: number; append?: boolean },
): Promise<NoteItem> {
  return api<NoteItem>(`/notes/${noteId}/practice-questions/generate`, {
    method: 'POST',
    body: JSON.stringify({
      count: options?.count ?? 4,
      append: options?.append ?? false,
    }),
  })
}

export async function addPracticeQuestion(
  noteId: string,
  question: string,
): Promise<NoteItem> {
  return api<NoteItem>(`/notes/${noteId}/practice-questions`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export async function updatePracticeQuestion(
  noteId: string,
  questionId: string,
  updates: { adopted?: boolean; score?: number },
): Promise<NoteItem> {
  return api<NoteItem>(`/notes/${noteId}/practice-questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function createNote(input: CreateNoteInput): Promise<NoteItem> {
  return api<NoteItem>('/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteItem> {
  return api<NoteItem>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteNote(id: string): Promise<{ success: boolean; deletedId: string }> {
  return api<{ success: boolean; deletedId: string }>(`/notes/${id}`, {
    method: 'DELETE',
  })
}
