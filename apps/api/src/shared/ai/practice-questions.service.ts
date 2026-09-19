import { randomBytes } from 'node:crypto'
import { env } from '../../config/env.js'

export interface GeneratedPracticeQuestion {
  question: string
}

export function createPracticeQuestionId(): string {
  return `pq_${Date.now()}_${randomBytes(3).toString('hex')}`
}

function buildMockQuestions(title: string, count: number): GeneratedPracticeQuestion[] {
  const templates = [
    `Explain "${title}" in simple words as if teaching a beginner.`,
    `What is the main idea behind "${title}" and why does it matter?`,
    `Describe one real-world example where "${title}" is used.`,
    `What are the most common mistakes students make about "${title}"?`,
    `How would you connect "${title}" to something you already know?`,
    `What would break or fail if you misunderstood "${title}"?`,
  ]

  return templates.slice(0, count).map((question) => ({ question }))
}

async function openAiGenerateQuestions(
  title: string,
  subject: string,
  content: string,
  count: number,
  existingQuestions: string[],
): Promise<GeneratedPracticeQuestion[]> {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    return buildMockQuestions(title, count)
  }

  const baseUrl = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const existingBlock =
    existingQuestions.length > 0
      ? `\nAvoid repeating these existing questions:\n${existingQuestions.map((q) => `- ${q}`).join('\n')}`
      : ''

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You create Feynman-style practice questions from study notes. Return ONLY JSON: {"questions":[{"question":"..."}]}. Questions must test understanding, not memorization.',
        },
        {
          role: 'user',
          content: `Subject: ${subject}\nTopic: ${title}\nNotes:\n${content.slice(0, 6000)}\n\nGenerate ${count} distinct practice questions.${existingBlock}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    return buildMockQuestions(title, count)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const raw = payload.choices?.[0]?.message?.content ?? '{}'
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned) as { questions?: Array<{ question?: string }> }
  const questions = (parsed.questions ?? [])
    .map((item) => ({ question: String(item.question ?? '').trim() }))
    .filter((item) => item.question.length > 0)

  if (questions.length === 0) {
    return buildMockQuestions(title, count)
  }

  return questions.slice(0, count)
}

export async function generatePracticeQuestionsFromContent(
  title: string,
  subject: string,
  content: string,
  options?: { count?: number; existingQuestions?: string[] },
): Promise<GeneratedPracticeQuestion[]> {
  const count = options?.count ?? 4
  const existingQuestions = options?.existingQuestions ?? []

  if (env.NODE_ENV === 'test' || env.LLM_PROVIDER === 'mock') {
    return buildMockQuestions(title, count)
  }

  return openAiGenerateQuestions(title, subject, content, count, existingQuestions)
}
