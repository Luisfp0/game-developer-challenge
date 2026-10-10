import { describe, expect, it } from 'vitest'
import { circleHitsRect } from '../game/collision'
import { SPAWN_POINTS } from '../game/spawn'
import {
  CHASER_START,
  GAME_CONFIG,
  ISLANDS,
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

  it('leaves the starts and spawn points in open water', () => {
    const places = [PLAYER_START, CHASER_START, ...SPAWN_POINTS]
    for (const place of places) {
      for (const island of ISLANDS) {
        expect(circleHitsRect({ x: place.x, y: place.y, radius: GAME_CONFIG.shipRadius }, island)).toBe(false)
      }
    }
  })
})
