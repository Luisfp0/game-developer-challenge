import { describe, expect, it } from 'vitest'
import {
  CHASER_START,
  GAME_CONFIG,
  PLAYER_START,
  TILE_SIZE,
} from './gameConfig'

describe('GAME_CONFIG', () => {
  it('matches the playable-slice defaults', () => {
    expect(GAME_CONFIG.matchSeconds).toBe(60)
    expect(GAME_CONFIG.playerHealth).toBe(3)
    expect(GAME_CONFIG.chaserHealth).toBe(2)
    expect(GAME_CONFIG.ramDamage).toBe(3)
    expect(GAME_CONFIG.shotCooldownSeconds).toBe(0.45)
  })

  it('spawns the chaser at least six tiles from the player', () => {
    const dx = CHASER_START.x - PLAYER_START.x
    const dy = CHASER_START.y - PLAYER_START.y
    expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(6 * TILE_SIZE)
  })
})
