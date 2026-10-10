import { describe, expect, it } from 'vitest'
import { circlesOverlap, circleHitsRect, clampToArena } from './index'

describe('collision', () => {
  it('detects overlapping circles', () => {
    expect(circlesOverlap(
      { x: 0, y: 0, radius: 10 },
      { x: 15, y: 0, radius: 10 },
    )).toBe(true)
    expect(circlesOverlap(
      { x: 0, y: 0, radius: 10 },
      { x: 30, y: 0, radius: 10 },
    )).toBe(false)
  })

  it('detects a circle touching a rectangle', () => {
    const rect = { x: 100, y: 100, width: 64, height: 64 }
    expect(circleHitsRect({ x: 90, y: 120, radius: 12 }, rect)).toBe(true)
    expect(circleHitsRect({ x: 40, y: 120, radius: 12 }, rect)).toBe(false)
  })

  it('keeps a circle inside the arena', () => {
    expect(clampToArena(-10, 20, 8, 100, 80)).toEqual({ x: 8, y: 20 })
    expect(clampToArena(95, 90, 8, 100, 80)).toEqual({ x: 92, y: 72 })
  })
})
