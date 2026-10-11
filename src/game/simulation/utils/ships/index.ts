import { CHASER_START, GAME_CONFIG, PLAYER_START } from '../../../../constants/gameConfig'
import type { Enemy } from '../../../../types/enemy'
import type { Ship } from '../../../../types/ship'
import type { MatchSeed } from '../../types'

export const createShip = (seed?: MatchSeed['ship']): Ship => {
  return {
    x: seed?.x ?? PLAYER_START.x,
    y: seed?.y ?? PLAYER_START.y,
    rotation: seed?.rotation ?? PLAYER_START.rotation,
    health: GAME_CONFIG.playerHealth,
    maxHealth: GAME_CONFIG.playerHealth,
    radius: GAME_CONFIG.shipRadius,
  }
}

export const createChaser = (seed?: MatchSeed['chaser']): Enemy => {
  return {
    id: 1,
    kind: 'chaser',
    x: seed?.x ?? CHASER_START.x,
    y: seed?.y ?? CHASER_START.y,
    rotation: 0,
    health: GAME_CONFIG.chaserHealth,
    maxHealth: GAME_CONFIG.chaserHealth,
    radius: GAME_CONFIG.shipRadius,
    alive: true,
  }
}
