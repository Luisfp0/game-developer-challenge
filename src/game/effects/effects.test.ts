import { describe, expect, it } from 'vitest'
import { hullFlames } from './index'

describe('hullFlames', () => {
  it('shows no flame at full health', () => {
    expect(hullFlames(3, 3)).toBe(0)
    expect(hullFlames(2, 2)).toBe(0)
  })

  it('shows one flame after a single hit', () => {
    expect(hullFlames(2, 3)).toBe(1)
    expect(hullFlames(1, 2)).toBe(1)
  })

  it('shows two flames when the player has one health left', () => {
    expect(hullFlames(1, 3)).toBe(2)
  })

  it('shows no flame when the ship is already destroyed', () => {
    expect(hullFlames(0, 3)).toBe(0)
    expect(hullFlames(0, 2)).toBe(0)
  })
})
