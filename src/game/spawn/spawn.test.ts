import { describe, expect, it } from 'vitest'
import { spawnPoint } from './index'

const island = { x: 448, y: 320, width: 128, height: 128 }
const shipRadius = 28
const minPlayerDistance = 384
const minShipDistance = 128

describe('spawnPoint', () => {
  it('picks the first valid default point skipping one blocked by a living enemy', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [{ x: 864, y: 160, alive: true }],
        startIndex: 0,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [island],
      }),
    ).toEqual({ x: 928, y: 384, nextIndex: 2 })
  })

  it('returns null when the only custom point sits on the island', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [],
        startIndex: 0,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [island],
        points: [{ x: 512, y: 384 }],
      }),
    ).toBeNull()
  })

  it('does not treat a dead enemy as blocking the same coordinates', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [{ x: 928, y: 384, alive: false }],
        startIndex: 0,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [island],
        points: [{ x: 928, y: 384 }],
      }),
    ).toEqual({ x: 928, y: 384, nextIndex: 0 })
  })

  it('returns null when the only custom point is too close to the player', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [],
        startIndex: 0,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [island],
        points: [{ x: 200, y: 400 }],
      }),
    ).toBeNull()
  })

  it('skips a point blocked by a living enemy and wraps nextIndex', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [{ x: 900, y: 400, alive: true }],
        startIndex: 0,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [island],
        points: [{ x: 900, y: 400 }, { x: 900, y: 80 }],
      }),
    ).toEqual({ x: 900, y: 80, nextIndex: 0 })
  })

  it('rejects a point that only overlaps the second island', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [],
        startIndex: 0,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [
          { x: 448, y: 320, width: 128, height: 128 },
          { x: 880, y: 60, width: 40, height: 40 },
        ],
        points: [{ x: 900, y: 80 }],
      }),
    ).toBeNull()
  })

  it('starts scanning at startIndex on the default points', () => {
    expect(
      spawnPoint({
        x: 160,
        y: 384,
        enemies: [],
        startIndex: 2,
        minPlayerDistance,
        minShipDistance,
        shipRadius,
        islands: [island],
      }),
    ).toEqual({ x: 928, y: 672, nextIndex: 3 })
  })
})
