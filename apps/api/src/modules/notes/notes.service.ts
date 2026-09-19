import { Evaluation } from '../../models/Evaluation.js'
import { ImportantDate } from '../../models/ImportantDate.js'
import { Note, type NoteDocument, type PracticeQuestion } from '../../models/Note.js'
import { User } from '../../models/User.js'
import { applyReviewAfterEvaluation, type CalendarContext } from '../analytics/spaced-repetition.service.js'
import {
  buildNoteEmbeddingText,
  embedText,
  rankBySimilarity,
} from '../../shared/ai/embedding.service.js'
import {
  createPracticeQuestionId,
  generatePracticeQuestionsFromContent,
} from '../../shared/ai/practice-questions.service.js'
import { env } from '../../config/env.js'
import { ApiError } from '../../shared/utils/api-error.js'
import { fromPublicNoteId, toPublicNoteId } from '../../shared/utils/note-id.js'
import { fromPublicUserId } from '../../shared/utils/user-id.js'
import type { CreateNoteBody, ListNotesQuery, NoteResponse, UpdateNoteBody } from './notes.schemas.js'
import { serializeNote } from './notes.serializer.js'

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

async function findOwnedNote(userId: string, noteId: string): Promise<NoteDocument> {
  const note = await Note.findOne({
    _id: fromPublicNoteId(noteId),
    userId: fromPublicUserId(userId),
  })

  if (!note) {
    throw new ApiError(404, 'NOTE_NOT_FOUND', `Note with id ${noteId} not found`)
  }

  return note
}

function toPracticeQuestionRecord(item: PracticeQuestion): PracticeQuestion {
  return {
    id: item.id,
    question: item.question,
    adopted: item.adopted ?? true,
    source: item.source === 'user' ? 'user' : 'ai',
    ...(item.score != null ? { score: item.score } : {}),
    ...(item.lastAnsweredAt ? { lastAnsweredAt: item.lastAnsweredAt } : {}),
  }
}

function buildPracticeQuestion(
  question: string,
  source: 'ai' | 'user',
): PracticeQuestion {
  return {
    id: createPracticeQuestionId(),
    question,
    adopted: true,
    source,
  }
}

async function savePracticeQuestions(
  publicUserId: string,
  noteId: string,
  practiceQuestions: PracticeQuestion[],
): Promise<NoteDocument> {
  const note = await Note.findOneAndUpdate(
    {
      _id: fromPublicNoteId(noteId),
      userId: fromPublicUserId(publicUserId),
    },
    { $set: { practiceQuestions } },
    { new: true },
  )

  if (!note) {
    throw new ApiError(404, 'NOTE_NOT_FOUND', `Note with id ${noteId} not found`)
  }

  return note
}

async function syncNoteEmbedding(note: NoteDocument): Promise<void> {
  if (!env.EMBEDDING_ENABLED && env.NODE_ENV !== 'test') {
    return
  }

  const embedding = await embedText(
    buildNoteEmbeddingText(note.title, note.subject, note.content),
  )

  note.embedding = embedding
  note.embeddingModel = env.OPENAI_EMBEDDING_MODEL
  note.embeddedAt = new Date()
  await note.save()
}

async function semanticSearchNotes(
  publicUserId: string,
  query: ListNotesQuery,
): Promise<NoteResponse[]> {
  const filter: Record<string, unknown> = {
    userId: fromPublicUserId(publicUserId),
  }

  if (query.subject) {
    filter.subject = query.subject
  }

  const notes = await Note.find(filter).select('+embedding')
  const queryEmbedding = await embedText(query.search ?? '')
  const ranked = rankBySimilarity(notes, queryEmbedding, query.minScore)

  const skip = (query.page - 1) * query.limit
  return ranked.slice(skip, skip + query.limit).map((note) => ({
    ...serializeNote(note),
    similarity: Number(note.similarity.toFixed(3)),
  }))
}

export async function listNotes(publicUserId: string, query: ListNotesQuery) {
  const filter: Record<string, unknown> = {
    userId: fromPublicUserId(publicUserId),
  }

  if (query.subject) {
    filter.subject = query.subject
  }

  if (query.search && query.searchMode === 'semantic') {
    return semanticSearchNotes(publicUserId, query)
  }

  if (query.search) {
    filter.$text = { $search: query.search }
  }

  const skip = (query.page - 1) * query.limit

  const notes = await Note.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(query.limit)

  return notes.map(serializeNote)
}

export async function getNote(publicUserId: string, noteId: string) {
  const note = await findOwnedNote(publicUserId, noteId)
  return serializeNote(note)
}

export async function createNote(publicUserId: string, input: CreateNoteBody) {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const note = await Note.create({
    userId: fromPublicUserId(publicUserId),
    title: input.title,
    subject: input.subject,
    icon: input.icon,
    content: input.content,
    nextReviewDate: tomorrow,
  })

  await syncNoteEmbedding(note)

  return serializeNote(note)
}

export async function updateNote(publicUserId: string, noteId: string, input: UpdateNoteBody) {
  await findOwnedNote(publicUserId, noteId)

  const updates: Record<string, unknown> = {}

  if (input.title !== undefined) updates.title = input.title
  if (input.subject !== undefined) updates.subject = input.subject
  if (input.icon !== undefined) updates.icon = input.icon
  if (input.content !== undefined) updates.content = input.content
  if (input.lectorScore !== undefined) updates.lectorScore = input.lectorScore
  if (input.practiceCount !== undefined) updates.practiceCount = input.practiceCount
  if (input.lastPracticed !== undefined) updates.lastPracticed = parseDateOnly(input.lastPracticed)
  if (input.retentionHealth !== undefined) updates.retentionHealth = input.retentionHealth
  if (input.nextReviewDate !== undefined) updates.nextReviewDate = parseDateOnly(input.nextReviewDate)

  const note = await Note.findOneAndUpdate(
    {
      _id: fromPublicNoteId(noteId),
      userId: fromPublicUserId(publicUserId),
    },
    { $set: updates },
    { new: true },
  )

  if (!note) {
    throw new ApiError(404, 'NOTE_NOT_FOUND', `Note with id ${noteId} not found`)
  }

  const contentChanged =
    input.title !== undefined || input.subject !== undefined || input.content !== undefined

  if (contentChanged) {
    await syncNoteEmbedding(note)
  }

  return serializeNote(note)
}

export async function recalculateNoteSchedule(publicUserId: string, noteId: string) {
  const note = await findOwnedNote(publicUserId, noteId)
  const user = await User.findById(fromPublicUserId(publicUserId))

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found')
  }

  const latestEvaluation = await Evaluation.findOne({
    userId: fromPublicUserId(publicUserId),
    noteId: note._id,
  }).sort({ createdAt: -1 })

  if (!latestEvaluation) {
    throw new ApiError(
      400,
      'NO_EVALUATION',
      'At least one evaluation is required before recalculating review schedule',
    )
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const importantDate = await ImportantDate.findOne({
    userId: fromPublicUserId(publicUserId),
    subject: note.subject,
    date: { $gte: today },
    priority: { $in: ['high', 'medium'] },
  }).sort({ date: 1 })

  const calendarContext: CalendarContext = {
    studyMode: user.calendarSettings?.studyMode ?? 'exam',
    examTargetDate: user.calendarSettings?.examTargetDate,
    importantDateDeadline: importantDate?.date ?? null,
  }

  const reviewUpdate = applyReviewAfterEvaluation(
    {
      easinessFactor: note.easinessFactor,
      interval: note.interval,
      repetition: note.repetition,
    },
    {
      lectorScore: latestEvaluation.lectorScore,
      correctness: latestEvaluation.correctness,
      clarity: latestEvaluation.clarity,
      completeness: latestEvaluation.completeness,
    },
    calendarContext,
  )

  const updated = await Note.findByIdAndUpdate(
    note._id,
    {
      $set: {
        retentionHealth: reviewUpdate.retentionHealth,
        nextReviewDate: reviewUpdate.nextReviewDate,
        easinessFactor: reviewUpdate.easinessFactor,
        interval: reviewUpdate.interval,
        repetition: reviewUpdate.repetition,
      },
    },
    { new: true },
  )

  if (!updated) {
    throw new ApiError(404, 'NOTE_NOT_FOUND', `Note with id ${noteId} not found`)
  }

  return serializeNote(updated)
}

export async function deleteNote(publicUserId: string, noteId: string) {
  const result = await Note.deleteOne({
    _id: fromPublicNoteId(noteId),
    userId: fromPublicUserId(publicUserId),
  })

  if (result.deletedCount === 0) {
    throw new ApiError(404, 'NOTE_NOT_FOUND', `Note with id ${noteId} not found`)
  }

  return {
    success: true,
    deletedId: toPublicNoteId(fromPublicNoteId(noteId)),
  }
}

export async function reindexNoteEmbeddings(publicUserId: string) {
  const notes = await Note.find({ userId: fromPublicUserId(publicUserId) })

  let updated = 0
  for (const note of notes) {
    await syncNoteEmbedding(note)
    updated += 1
  }

  return {
    success: true,
    updated,
  }
}

export async function generatePracticeQuestionsForNote(
  publicUserId: string,
  noteId: string,
  input: { count?: number; append?: boolean },
) {
  const note = await findOwnedNote(publicUserId, noteId)
  const count = input.count ?? 4
  const append = input.append ?? false
  const existing = append ? (note.practiceQuestions ?? []) : []

  const generated = await generatePracticeQuestionsFromContent(
    note.title,
    note.subject,
    note.content,
    {
      count,
      existingQuestions: existing.map((item) => item.question),
    },
  )

  const nextQuestions = generated.map((item) => buildPracticeQuestion(item.question, 'ai'))
  const practiceQuestions = append
    ? [...existing.map(toPracticeQuestionRecord), ...nextQuestions]
    : nextQuestions

  const updated = await savePracticeQuestions(publicUserId, noteId, practiceQuestions)
  return serializeNote(updated)
}

export async function addPracticeQuestionToNote(
  publicUserId: string,
  noteId: string,
  question: string,
) {
  const note = await findOwnedNote(publicUserId, noteId)
  const practiceQuestions = [
    ...(note.practiceQuestions ?? []).map(toPracticeQuestionRecord),
    buildPracticeQuestion(question, 'user'),
  ]

  const updated = await savePracticeQuestions(publicUserId, noteId, practiceQuestions)
  return serializeNote(updated)
}

export async function updatePracticeQuestionOnNote(
  publicUserId: string,
  noteId: string,
  questionId: string,
  updates: { adopted?: boolean; score?: number },
) {
  const note = await findOwnedNote(publicUserId, noteId)
  const practiceQuestions = (note.practiceQuestions ?? []).map((item) => {
    if (item.id !== questionId) {
      return toPracticeQuestionRecord(item)
    }

    return {
      ...toPracticeQuestionRecord(item),
      ...(updates.adopted !== undefined ? { adopted: updates.adopted } : {}),
      ...(updates.score !== undefined
        ? { score: updates.score, lastAnsweredAt: new Date() }
        : {}),
    }
  })

  if (!practiceQuestions.some((item) => item.id === questionId)) {
    throw new ApiError(404, 'QUESTION_NOT_FOUND', `Practice question ${questionId} not found`)
  }

  const updated = await savePracticeQuestions(publicUserId, noteId, practiceQuestions)
  return serializeNote(updated)
}

export async function scorePracticeQuestionOnNote(
  publicUserId: string,
  noteId: string,
  questionId: string,
  score: number,
) {
  return updatePracticeQuestionOnNote(publicUserId, noteId, questionId, { score })
}
