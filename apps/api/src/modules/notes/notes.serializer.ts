import type { NoteDocument } from '../../models/Note.js'
import { toPublicNoteId } from '../../shared/utils/note-id.js'
import type { NoteResponse, PracticeQuestionResponse } from './notes.schemas.js'

function formatDateOnly(value: Date | undefined | null): string | undefined {
  if (!value) return undefined
  return value.toISOString().split('T')[0]
}

function serializePracticeQuestions(note: NoteDocument): PracticeQuestionResponse[] {
  return (note.practiceQuestions ?? []).map((item) => ({
    id: item.id,
    question: item.question,
    adopted: item.adopted ?? true,
    source: item.source === 'user' ? 'user' : 'ai',
    ...(item.score != null ? { score: item.score } : {}),
    ...(item.lastAnsweredAt ? { lastAnsweredAt: item.lastAnsweredAt.toISOString() } : {}),
  }))
}

export function serializeNote(note: NoteDocument): NoteResponse {
  return {
    id: toPublicNoteId(note._id),
    title: note.title,
    subject: note.subject,
    icon: note.icon,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    ...(note.lectorScore != null ? { lectorScore: note.lectorScore } : {}),
    practiceCount: note.practiceCount,
    ...(note.lastPracticed ? { lastPracticed: formatDateOnly(note.lastPracticed) } : {}),
    retentionHealth: note.retentionHealth,
    ...(note.nextReviewDate ? { nextReviewDate: formatDateOnly(note.nextReviewDate) } : {}),
    ...(note.interval != null ? { interval: note.interval } : {}),
    ...(note.repetition != null ? { repetition: note.repetition } : {}),
    practiceQuestions: serializePracticeQuestions(note),
  }
}
