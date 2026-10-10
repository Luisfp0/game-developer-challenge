import { GAME_CONFIG } from '../../constants/gameConfig'
import type { EndReason } from '../../types/game'
import type { OptionsStorage } from '../options'

export const LAST_MATCH_STORAGE_KEY = 'pirate-battle-last-match'
export const MATCH_HISTORY_LIMIT = 20

export const MATCH_SAVED = 'Match saved.'
export const MATCH_NOT_SAVED = 'Match could not be saved.'

export type LastMatch = {
  score: number
  timePlayedSeconds: number
  endReason: EndReason
  matchSeconds: number
  spawnIntervalSeconds: number
  playedAt: string
}

function wholeInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function isLastMatch(value: unknown): value is LastMatch {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.score === 'number' &&
    Number.isInteger(record.score) &&
    record.score >= 0 &&
    typeof record.timePlayedSeconds === 'number' &&
    Number.isFinite(record.timePlayedSeconds) &&
    record.timePlayedSeconds >= 0 &&
    (record.endReason === 'time' || record.endReason === 'destroyed') &&
    wholeInRange(record.matchSeconds, GAME_CONFIG.matchSecondsMin, GAME_CONFIG.matchSecondsMax) &&
    wholeInRange(
      record.spawnIntervalSeconds,
      GAME_CONFIG.spawnIntervalMin,
      GAME_CONFIG.spawnIntervalMax,
    ) &&
    typeof record.playedAt === 'string' &&
    record.playedAt.length > 0
  )
}

function copyMatch(match: LastMatch): LastMatch {
  return {
    score: match.score,
    timePlayedSeconds: match.timePlayedSeconds,
    endReason: match.endReason,
    matchSeconds: match.matchSeconds,
    spawnIntervalSeconds: match.spawnIntervalSeconds,
    playedAt: match.playedAt,
  }
}

export function readMatchHistory(storage: OptionsStorage): LastMatch[] {
  const raw = storage.getItem(LAST_MATCH_STORAGE_KEY)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    return items.filter(isLastMatch).slice(0, MATCH_HISTORY_LIMIT).map(copyMatch)
  } catch {
    return []
  }
}

export function readLastMatch(storage: OptionsStorage): LastMatch | null {
  return readMatchHistory(storage)[0] ?? null
}

export function writeLastMatch(storage: OptionsStorage, match: LastMatch): boolean {
  if (!isLastMatch(match)) return false
  try {
    const history = [copyMatch(match), ...readMatchHistory(storage)].slice(0, MATCH_HISTORY_LIMIT)
    storage.setItem(LAST_MATCH_STORAGE_KEY, JSON.stringify(history))
    return true
  } catch {
    return false
  }
}
