import { describe, expect, it } from 'vitest'
import { cosineSimilarity } from '../src/shared/utils/cosine-similarity.js'
import { rankBySimilarity } from '../src/shared/ai/embedding.service.js'

describe('semantic search helpers', () => {
  it('returns 1 for identical vectors', () => {
    const vector = [0.2, 0.5, 0.8]
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5)
  })

  it('ranks closest embeddings first', () => {
    const query = [1, 0, 0]
    const ranked = rankBySimilarity(
      [
        { id: 'a', embedding: [0.9, 0.1, 0] },
        { id: 'b', embedding: [0, 1, 0] },
      ],
      query,
      0.1,
    )

    expect(ranked[0]?.id).toBe('a')
  })
})
