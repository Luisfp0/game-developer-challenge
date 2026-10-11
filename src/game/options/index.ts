import { GAME_CONFIG } from '../../constants/gameConfig'
import { OPTIONS_STORAGE_KEY, SESSION_TIME_ERROR, SPAWN_TIME_ERROR } from './constants'
import type { FieldErrors, OptionsStorage, SavedOptions } from './types'
import { wholeInRange } from './utils/wholeInRange'

export { OPTIONS_STORAGE_KEY, SESSION_TIME_ERROR, SPAWN_TIME_ERROR }
export type { FieldErrors, OptionsStorage, SavedOptions }

const DEFAULT_OPTIONS: SavedOptions = {
  matchSeconds: GAME_CONFIG.matchSeconds,
  spawnIntervalSeconds: GAME_CONFIG.spawnIntervalSeconds,
}

export const fieldErrors = (matchSeconds: string, spawnIntervalSeconds: string): FieldErrors => {
  const session = wholeInRange(matchSeconds, GAME_CONFIG.matchSecondsMin, GAME_CONFIG.matchSecondsMax)
  const spawn = wholeInRange(
    spawnIntervalSeconds,
    GAME_CONFIG.spawnIntervalMin,
    GAME_CONFIG.spawnIntervalMax,
  )
  return {
    matchSeconds: session === null ? SESSION_TIME_ERROR : null,
    spawnIntervalSeconds: spawn === null ? SPAWN_TIME_ERROR : null,
  }
}

export const optionsFromFields = (matchSeconds: string, spawnIntervalSeconds: string): SavedOptions | null => {
  const session = wholeInRange(matchSeconds, GAME_CONFIG.matchSecondsMin, GAME_CONFIG.matchSecondsMax)
  const spawn = wholeInRange(
    spawnIntervalSeconds,
    GAME_CONFIG.spawnIntervalMin,
    GAME_CONFIG.spawnIntervalMax,
  )
  if (session === null || spawn === null) return null
  return { matchSeconds: session, spawnIntervalSeconds: spawn }
}

const isSaved = (value: unknown): value is SavedOptions => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const matchSeconds = record.matchSeconds
  const spawnIntervalSeconds = record.spawnIntervalSeconds
  return (
    typeof matchSeconds === 'number' &&
    typeof spawnIntervalSeconds === 'number' &&
    Number.isInteger(matchSeconds) &&
    Number.isInteger(spawnIntervalSeconds) &&
    matchSeconds >= GAME_CONFIG.matchSecondsMin &&
    matchSeconds <= GAME_CONFIG.matchSecondsMax &&
    spawnIntervalSeconds >= GAME_CONFIG.spawnIntervalMin &&
    spawnIntervalSeconds <= GAME_CONFIG.spawnIntervalMax
  )
}

export const readOptions = (storage: OptionsStorage): SavedOptions => {
  const raw = storage.getItem(OPTIONS_STORAGE_KEY)
  if (raw === null) return { ...DEFAULT_OPTIONS }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isSaved(parsed)) return { ...DEFAULT_OPTIONS }
    return {
      matchSeconds: parsed.matchSeconds,
      spawnIntervalSeconds: parsed.spawnIntervalSeconds,
    }
  } catch {
    return { ...DEFAULT_OPTIONS }
  }
}

export const writeOptions = (storage: OptionsStorage, options: SavedOptions): void => {
  storage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options))
}
