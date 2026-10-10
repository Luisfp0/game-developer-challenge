import { describe, expect, it } from 'vitest'
import { ARENA_HEIGHT, ARENA_WIDTH, ISLAND, PLAYER_START } from '../../constants/gameConfig'
import { createMatch } from './index'

const idle = { forward: false, left: false, right: false, fire: false }

describe('movement', () => {
  it('sails upward when rotation is 0', () => {
    const match = createMatch()
    const startY = match.snapshot().ship.y
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(ship.y).toBeLessThan(startY)
    expect(ship.x).toBe(PLAYER_START.x)
  })

  it('does not enter the island', () => {
    const match = createMatch({
      ship: { x: ISLAND.x - 29, y: ISLAND.y + 64, rotation: Math.PI / 2 },
    })
    match.update(1, { ...idle, forward: true })
    expect(match.snapshot().ship.x).toBe(ISLAND.x - 29)
  })

  it('does not leave the arena', () => {
    const match = createMatch({ ship: { x: 40, y: 40, rotation: Math.PI } })
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(ship.x).toBeGreaterThanOrEqual(ship.radius)
    expect(ship.y).toBeGreaterThanOrEqual(ship.radius)
    expect(ship.x).toBeLessThanOrEqual(ARENA_WIDTH - ship.radius)
    expect(ship.y).toBeLessThanOrEqual(ARENA_HEIGHT - ship.radius)
  })
})
