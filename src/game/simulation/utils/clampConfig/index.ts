import { GAME_CONFIG } from '../../../../constants/gameConfig'

export const clampMatchSeconds = (requested?: number): number => {
  if (requested === undefined) return GAME_CONFIG.matchSeconds
  return Math.min(
    GAME_CONFIG.matchSecondsMax,
    Math.max(GAME_CONFIG.matchSecondsMin, requested),
  )
}

export const clampSpawnInterval = (requested?: number): number => {
  if (requested === undefined) return GAME_CONFIG.spawnIntervalSeconds
  return Math.min(
    GAME_CONFIG.spawnIntervalMax,
    Math.max(GAME_CONFIG.spawnIntervalMin, requested),
  )
}
