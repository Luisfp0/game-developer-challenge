import type { Island } from '../types/game'

export const TILE_SIZE = 64
export const ARENA_COLS = 16
export const ARENA_ROWS = 12
export const ARENA_WIDTH = TILE_SIZE * ARENA_COLS
export const ARENA_HEIGHT = TILE_SIZE * ARENA_ROWS

export const ISLAND: Island = {
  x: 7 * TILE_SIZE,
  y: 5 * TILE_SIZE,
  width: TILE_SIZE * 2,
  height: TILE_SIZE * 2,
}

export const PLAYER_START = { x: 160, y: 384, rotation: 0 }
export const CHASER_START = { x: 864, y: 160 }

export const GAME_CONFIG = {
  matchSeconds: 60,
  matchSecondsMin: 60,
  matchSecondsMax: 180,
  playerHealth: 3,
  chaserHealth: 2,
  shooterHealth: 2,
  shooterRange: 256,
  shooterCooldownSeconds: 1.2,
  ramDamage: 3,
  shotDamage: 1,
  shipSpeed: 140,
  chaserSpeed: 90,
  rotationSpeed: 2.2,
  projectileSpeed: 320,
  projectileRadius: 6,
  shipRadius: 28,
  shotCooldownSeconds: 0.45,
  spawnIntervalSeconds: 10,
  spawnIntervalMin: 5,
  spawnIntervalMax: 30,
  spawnPlayerDistance: 384,
  spawnShipDistance: 128,
} as const
