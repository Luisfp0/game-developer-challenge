import { describe, expect, it } from 'vitest'
import { ARENA_HEIGHT, ARENA_WIDTH, ISLANDS, PLAYER_START, TILE_SIZE } from '../../constants/gameConfig'
import { circleHitsRoundRect } from '../collision'
import { createMatch } from './index'

const idle = {
  forward: false,
  left: false,
  right: false,
  fire: false,
  fireLeft: false,
  fireRight: false,
}

describe('movement', () => {
  it('sails upward when rotation is 0', () => {
    const match = createMatch()
    const startY = match.snapshot().ship.y
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(ship.y).toBeLessThan(startY)
    expect(ship.x).toBe(PLAYER_START.x)
  })

  const staysOffTheSand = (body: { x: number; y: number; radius: number }, island: (typeof ISLANDS)[number]) => {
    expect(circleHitsRoundRect({ ...body, radius: body.radius - 1 }, island, TILE_SIZE)).toBe(false)
  }

  it('does not enter the island', () => {
    const island = ISLANDS[0]
    const match = createMatch({
      ship: { x: island.x - 29, y: island.y + island.height / 2, rotation: Math.PI / 2 },
    })
    const before = match.snapshot().ship
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(ship.y).toBe(before.y)
    expect(ship.x).toBeLessThan(island.x)
    staysOffTheSand(ship, island)
  })

  it('does not enter the upper sand bank', () => {
    const bank = ISLANDS[1]
    const match = createMatch({
      ship: { x: bank.x - 29, y: bank.y + 64, rotation: Math.PI / 2 },
    })
    const before = match.snapshot().ship
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(ship.y).toBe(before.y)
    expect(ship.x).toBeLessThan(bank.x)
    staysOffTheSand(ship, bank)
  })

  it('slides along the sand when the heading is diagonal', () => {
    const island = ISLANDS[0]
    const match = createMatch({
      ship: { x: island.x - 29, y: island.y + 128, rotation: Math.PI / 4 },
    })
    const before = match.snapshot().ship
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(ship.y).toBeLessThan(before.y)
    expect(ship.x).toBeLessThan(island.x)
    staysOffTheSand(ship, island)
  })

  it('slides along the shore even when the bow is almost straight into it', () => {
    const island = ISLANDS[0]
    const match = createMatch({
      ship: { x: island.x - 29, y: island.y + island.height / 2, rotation: Math.PI / 2 - 0.15 },
      chaser: { x: 980, y: 740 },
    })
    const before = match.snapshot().ship
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(before.y - ship.y).toBeGreaterThan(4)
    staysOffTheSand(ship, island)
  })

  it('keeps moving through the empty corner of the sand', () => {
    const island = ISLANDS[0]
    const gap = 29 / Math.SQRT2
    const match = createMatch({
      ship: { x: island.x - gap, y: island.y - gap, rotation: (3 * Math.PI) / 4 },
      chaser: { x: 980, y: 740 },
    })
    const before = match.snapshot().ship
    match.update(1, { ...idle, forward: true })
    const ship = match.snapshot().ship
    expect(Math.hypot(ship.x - before.x, ship.y - before.y)).toBeGreaterThan(1)
    staysOffTheSand(ship, island)
  })

  it('a chaser follows the shore instead of parking on it', () => {
    const island = ISLANDS[0]
    const match = createMatch({
      ship: { x: island.x + island.width + 160, y: island.y + island.height / 2, rotation: 0 },
      chaser: { x: island.x - 100, y: island.y + island.height / 2 },
    })
    const before = match.snapshot().enemies[0]
    for (let i = 0; i < 30; i += 1) match.update(0.05, idle)
    const chaser = match.snapshot().enemies[0]
    expect(chaser.y).not.toBe(before.y)
    staysOffTheSand(chaser, island)
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
