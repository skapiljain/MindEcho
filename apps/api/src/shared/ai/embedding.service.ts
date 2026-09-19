import { createHash } from 'node:crypto'
import { env } from '../../config/env.js'
import { cosineSimilarity } from '../utils/cosine-similarity.js'

const EMBEDDING_DIMENSIONS = 1536

export function buildNoteEmbeddingText(title: string, subject: string, content: string): string {
  return `Subject: ${subject}\nTitle: ${title}\n\n${content}`.trim().slice(0, 8000)
}

function normalizeVector(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) return values
  return values.map((value) => value / norm)
}

function mockEmbed(text: string): number[] {
  const hash = createHash('sha256').update(text).digest()
  const values = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, index) => {
    const byte = hash[index % hash.length] ?? 0
    return (byte / 255) * 2 - 1
  })
  return normalizeVector(values)
}

async function openAiEmbed(text: string): Promise<number[]> {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for semantic search embeddings')
  }

  const baseUrl = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Embedding request failed (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>
  }

  const embedding = payload.data?.[0]?.embedding
  if (!embedding?.length) {
    throw new Error('Embedding API returned an empty vector')
  }

  return embedding
}

export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim()
  if (!trimmed) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0)
  }

  if (env.NODE_ENV === 'test' || env.EMBEDDING_PROVIDER === 'mock') {
    return mockEmbed(trimmed)
  }

  if (!env.EMBEDDING_ENABLED) {
    return mockEmbed(trimmed)
  }

  return openAiEmbed(trimmed)
}

export function rankBySimilarity<T extends { embedding?: number[] | null }>(
  items: T[],
  queryEmbedding: number[],
  minScore = 0.25,
): Array<T & { similarity: number }> {
  return items
    .map((item) => ({
      ...item,
      similarity: item.embedding?.length ? cosineSimilarity(queryEmbedding, item.embedding) : 0,
    }))
    .filter((item) => item.similarity >= minScore)
    .sort((a, b) => b.similarity - a.similarity)
}
