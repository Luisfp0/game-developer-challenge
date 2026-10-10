import { describe, expect, it } from 'vitest'
import type { OptionsStorage } from '../game/options'
import { migrateSavedMatches, readConfirmed } from './store'

function memory(): OptionsStorage {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

describe('saved match migration', () => {
  it('copies the local list once', () => {
    const storage = memory()
    storage.setItem(
      'pirate-battle-last-match',
      JSON.stringify([
        {
          score: 4,
          timePlayedSeconds: 22,
          endReason: 'destroyed',
          matchSeconds: 60,
          spawnIntervalSeconds: 10,
          playedAt: '2026-10-09T12:00:00.000Z',
        },
      ]),
    )
    const player = { id: 'you', name: 'You' as const }
    let ids = 0
    migrateSavedMatches(storage, player, () => `moved-${ids++}`)
    migrateSavedMatches(storage, player, () => `moved-${ids++}`)
    const confirmed = readConfirmed(storage)
    expect(confirmed).toHaveLength(1)
    expect(confirmed[0]).toMatchObject({ matchId: 'moved-0', playerId: 'you', score: 4 })
  })
})
