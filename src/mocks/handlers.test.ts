import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { OptionsStorage } from '../game/options'
import type { MatchRecord } from '../game/records'
import { createHandlers } from './handlers'
import { writeScenario } from './scenarios'
import { readConfirmed } from './store'

const memory = (): OptionsStorage => {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

const record = (overrides: Partial<MatchRecord> = {}): MatchRecord => {
  return {
    matchId: 'match-1',
    playerId: 'you',
    playerName: 'You',
    playedAt: '2026-10-10T18:00:00.000Z',
    score: 3,
    timePlayedSeconds: 40,
    endReason: 'time',
    matchSeconds: 60,
    spawnIntervalSeconds: 10,
    ...overrides,
  }
}

const storage = memory()
const server = setupServer(...createHandlers(storage))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  writeScenario(storage, 'success')
  storage.setItem('pirate-battle-confirmed-matches', '[]')
})
afterAll(() => server.close())

describe('match api', () => {
  it('pages the ranking for the saved configuration', async () => {
    const response = await fetch(
      'http://localhost/api/ranking?matchSeconds=60&spawnIntervalSeconds=10&page=2',
    )
    const body = (await response.json()) as { items: MatchRecord[]; total: number }
    expect(response.ok).toBe(true)
    expect(body.total).toBe(12)
    expect(body.items.map((item) => item.score)).toEqual([2, 1])
  })

  it('returns an empty ranking without discarding a saved match', async () => {
    writeScenario(storage, 'empty')
    const saved = record()
    const posted = await fetch('http://localhost/api/matches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(saved),
    })
    const ranking = await fetch(
      'http://localhost/api/ranking?matchSeconds=60&spawnIntervalSeconds=10&page=1',
    )
    const body = (await ranking.json()) as { total: number }
    expect(posted.ok).toBe(true)
    expect(body.total).toBe(0)
    expect(readConfirmed(storage)).toHaveLength(1)
  })

  it('stores one match when the same id is posted twice', async () => {
    const saved = record({ playerId: 'fresh' })
    await fetch('http://localhost/api/matches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(saved),
    })
    const repeat = await fetch('http://localhost/api/matches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...saved, score: 99 }),
    })
    const stored = (await repeat.json()) as MatchRecord
    const history = await fetch('http://localhost/api/history?playerId=fresh&page=1')
    const body = (await history.json()) as { total: number; items: MatchRecord[] }
    expect(stored.score).toBe(3)
    expect(body.total).toBe(1)
    expect(body.items[0].matchId).toBe('match-1')
  })

  it('rejects an invalid match', async () => {
    const response = await fetch('http://localhost/api/matches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ matchId: '' }),
    })
    expect(response.status).toBe(400)
  })

  it('fails a ranking request when the scenario is error', async () => {
    writeScenario(storage, 'error')
    const response = await fetch(
      'http://localhost/api/ranking?matchSeconds=60&spawnIntervalSeconds=10&page=1',
    )
    expect(response.status).toBe(500)
  })

  it('clears confirmed records', async () => {
    await fetch('http://localhost/api/matches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record()),
    })
    const response = await fetch('http://localhost/api/reset', { method: 'POST' })
    expect(response.status).toBe(204)
    expect(readConfirmed(storage)).toEqual([])
  })
})
