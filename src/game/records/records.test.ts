import { describe, expect, it } from 'vitest'
import {
  listPlayerMatches,
  paginate,
  rankMatches,
  registerMatch,
  type MatchRecord,
} from './index'

const match = (overrides: Partial<MatchRecord> = {}): MatchRecord => {
  return {
    matchId: 'match-1',
    playerId: 'you',
    playerName: 'You',
    playedAt: '2026-10-10T18:00:00.000Z',
    score: 1,
    timePlayedSeconds: 30,
    endReason: 'time',
    matchSeconds: 60,
    spawnIntervalSeconds: 10,
    ...overrides,
  }
}

describe('match records', () => {
  it('ranks the same configuration by score, time played, date, then id', () => {
    const records = [
      match({ matchId: 'b', playerId: 'a', playerName: 'Ann', score: 5, timePlayedSeconds: 20, playedAt: '2026-10-02T00:00:00.000Z' }),
      match({ matchId: 'a', playerId: 'b', playerName: 'Bea', score: 5, timePlayedSeconds: 40, playedAt: '2026-10-03T00:00:00.000Z' }),
      match({ matchId: 'd', playerId: 'c', playerName: 'Cy', score: 5, timePlayedSeconds: 40, playedAt: '2026-10-01T00:00:00.000Z' }),
      match({ matchId: 'c', playerId: 'd', playerName: 'Dee', score: 9, timePlayedSeconds: 10, playedAt: '2026-10-04T00:00:00.000Z' }),
      match({ matchId: 'other', playerId: 'e', playerName: 'Eve', score: 99, matchSeconds: 90 }),
    ]
    const page = rankMatches(records, { matchSeconds: 60, spawnIntervalSeconds: 10 }, 1)
    expect(page.total).toBe(4)
    expect(page.items.map((item) => item.matchId)).toEqual(['c', 'd', 'a', 'b'])
  })

  it('pages the ranking by ten', () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      match({ matchId: `m-${index}`, score: index }),
    )
    const first = rankMatches(records, { matchSeconds: 60, spawnIntervalSeconds: 10 }, 1)
    const second = rankMatches(records, { matchSeconds: 60, spawnIntervalSeconds: 10 }, 2)
    expect(first.items).toHaveLength(10)
    expect(first.items[0].score).toBe(11)
    expect(second.items.map((item) => item.score)).toEqual([1, 0])
    expect(second.total).toBe(12)
    expect(paginate([], 1).items).toEqual([])
  })

  it('lists one player from newest to oldest', () => {
    const records = [
      match({ matchId: 'old', playedAt: '2026-10-01T00:00:00.000Z' }),
      match({ matchId: 'new', playedAt: '2026-10-03T00:00:00.000Z' }),
      match({ matchId: 'other', playerId: 'them', playedAt: '2026-10-04T00:00:00.000Z' }),
    ]
    expect(listPlayerMatches(records, 'you', 1).items.map((item) => item.matchId)).toEqual(['new', 'old'])
  })

  it('registers a match once and returns the original on a repeat', () => {
    const first = registerMatch([], match())
    const second = registerMatch(first.records, match({ score: 99 }))
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.record.score).toBe(1)
    expect(second.records).toHaveLength(1)
  })
})
