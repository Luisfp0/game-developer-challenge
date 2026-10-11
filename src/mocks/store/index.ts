import { readMatchHistory } from '../../game/lastMatch'
import type { OptionsStorage } from '../../game/options'
import type { Player } from '../../game/player'
import { isMatchRecord, registerMatch, type MatchRecord } from '../../game/records'
import { FIXTURES } from '../fixtures'
import { CONFIRMED_MATCHES_KEY, HISTORY_MIGRATED_KEY } from './constants'

export { CONFIRMED_MATCHES_KEY, HISTORY_MIGRATED_KEY }

export const readConfirmed = (storage: OptionsStorage): MatchRecord[] => {
  const raw = storage.getItem(CONFIRMED_MATCHES_KEY)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isMatchRecord)
  } catch {
    return []
  }
}

export const writeConfirmed = (storage: OptionsStorage, records: MatchRecord[]): void => {
  storage.setItem(CONFIRMED_MATCHES_KEY, JSON.stringify(records))
}

export const readAllMatches = (storage: OptionsStorage): MatchRecord[] => {
  const confirmed = readConfirmed(storage)
  const ids = new Set(confirmed.map((record) => record.matchId))
  return [...confirmed, ...FIXTURES.filter((record) => !ids.has(record.matchId))]
}

export const confirmMatch = (storage: OptionsStorage, incoming: MatchRecord): MatchRecord => {
  const confirmed = readConfirmed(storage)
  const result = registerMatch(confirmed, incoming)
  if (result.created) writeConfirmed(storage, result.records)
  return result.record
}

export const migrateSavedMatches = (storage: OptionsStorage, player: Player, createId: () => string): void => {
  if (storage.getItem(HISTORY_MIGRATED_KEY) === '1') return
  let confirmed = readConfirmed(storage)
  for (const saved of readMatchHistory(storage)) {
    confirmed = registerMatch(confirmed, {
      matchId: createId(),
      playerId: player.id,
      playerName: player.name,
      playedAt: saved.playedAt,
      score: saved.score,
      timePlayedSeconds: saved.timePlayedSeconds,
      endReason: saved.endReason,
      matchSeconds: saved.matchSeconds,
      spawnIntervalSeconds: saved.spawnIntervalSeconds,
    }).records
  }
  writeConfirmed(storage, confirmed)
  storage.setItem(HISTORY_MIGRATED_KEY, '1')
}
