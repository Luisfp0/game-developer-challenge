import { GAME_CONFIG } from '../../constants/gameConfig'

export const OPTIONS_STORAGE_KEY = 'pirate-battle-options'

export const SESSION_TIME_ERROR = 'Game session time must be a whole number from 60 to 180.'
export const SPAWN_TIME_ERROR = 'Enemy spawn time must be a whole number from 5 to 30.'

export type SavedOptions = {
  matchSeconds: number
  spawnIntervalSeconds: number
}

export type OptionsStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type FieldErrors = {
  matchSeconds: string | null
  spawnIntervalSeconds: string | null
}

const DEFAULT_OPTIONS: SavedOptions = {
  matchSeconds: GAME_CONFIG.matchSeconds,
  spawnIntervalSeconds: GAME_CONFIG.spawnIntervalSeconds,
}

const wholeInRange = (value: string, min: number, max: number): number | null => {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const number = Number(trimmed)
  if (number < min || number > max) return null
  return number
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
