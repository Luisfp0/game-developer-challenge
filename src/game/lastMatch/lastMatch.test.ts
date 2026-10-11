import { describe, expect, it } from 'vitest'
import {
  LAST_MATCH_STORAGE_KEY,
  readLastMatch,
  readMatchHistory,
  writeLastMatch,
  type LastMatch,
} from './index'

const match: LastMatch = {
  score: 2,
  timePlayedSeconds: 14.2,
  endReason: 'destroyed',
  matchSeconds: 60,
  spawnIntervalSeconds: 10,
  playedAt: '2026-10-10T18:00:00.000Z',
}

const memory = () => {
  const data = new Map<string, string>()
  return {
    getItem(key: string) {
      return data.get(key) ?? null
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
  }
}

describe('last match', () => {
  it('returns null when nothing is stored', () => {
    expect(readLastMatch(memory())).toBeNull()
  })

  it('stores one completed match and reads it back', () => {
    const storage = memory()
    expect(writeLastMatch(storage, match)).toBe(true)
    expect(readLastMatch(storage)).toEqual(match)
    expect(storage.getItem(LAST_MATCH_STORAGE_KEY)).toContain('"score":2')
  })

  it('replaces the previous completed match', () => {
    const storage = memory()
    writeLastMatch(storage, match)
    const next = { ...match, score: 5, endReason: 'time' as const }
    writeLastMatch(storage, next)
    expect(readLastMatch(storage)).toEqual(next)
  })

  it('returns null for broken or incomplete storage', () => {
    const storage = memory()
    storage.setItem(LAST_MATCH_STORAGE_KEY, '{')
    expect(readLastMatch(storage)).toBeNull()
    storage.setItem(LAST_MATCH_STORAGE_KEY, JSON.stringify({ ...match, endReason: 'quit' }))
    expect(readLastMatch(storage)).toBeNull()
    storage.setItem(LAST_MATCH_STORAGE_KEY, JSON.stringify({ ...match, score: 1.5 }))
    expect(readLastMatch(storage)).toBeNull()
    storage.setItem(LAST_MATCH_STORAGE_KEY, JSON.stringify({ ...match, matchSeconds: 10 }))
    expect(readLastMatch(storage)).toBeNull()
  })

  it('returns an empty history when nothing is stored', () => {
    expect(readMatchHistory(memory())).toEqual([])
  })

  it('keeps completed matches with the newest first', () => {
    const storage = memory()
    writeLastMatch(storage, match)
    writeLastMatch(storage, { ...match, score: 5, endReason: 'time' })
    expect(readMatchHistory(storage).map((item) => item.score)).toEqual([5, 2])
  })

  it('reads an older single match as the start of the history', () => {
    const storage = memory()
    storage.setItem(LAST_MATCH_STORAGE_KEY, JSON.stringify(match))
    expect(readMatchHistory(storage)).toEqual([match])
    writeLastMatch(storage, { ...match, score: 4 })
    expect(readMatchHistory(storage).map((item) => item.score)).toEqual([4, 2])
  })

  it('drops the oldest match after twenty', () => {
    const storage = memory()
    for (let score = 0; score < 21; score += 1) {
      writeLastMatch(storage, {
        ...match,
        score,
        playedAt: `2026-10-10T18:00:${String(score).padStart(2, '0')}.000Z`,
      })
    }
    const history = readMatchHistory(storage)
    expect(history).toHaveLength(20)
    expect(history[0].score).toBe(20)
    expect(history.at(-1)?.score).toBe(1)
  })

  it('skips a broken entry inside the history', () => {
    const storage = memory()
    storage.setItem(LAST_MATCH_STORAGE_KEY, JSON.stringify([match, { ...match, score: -1 }]))
    expect(readMatchHistory(storage)).toEqual([match])
  })

  it('reports failure when storage rejects the write', () => {
    const storage = {
      getItem() {
        return null
      },
      setItem() {
        throw new Error('full')
      },
    }
    expect(writeLastMatch(storage, match)).toBe(false)
    expect(readLastMatch(storage)).toBeNull()
  })
})
