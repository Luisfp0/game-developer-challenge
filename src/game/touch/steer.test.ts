import { describe, expect, it } from 'vitest'
import { controlsFromStick, stickFromDrag } from './index'

describe('controlsFromStick', () => {
  it('sails forward when the drag points the way the ship already faces', () => {
    expect(controlsFromStick(0, { x: 0, y: -1 })).toEqual({
      forward: true,
      left: false,
      right: false,
      fire: false,
    })
  })

  it('turns right when the drag is to the right of the bow', () => {
    expect(controlsFromStick(0, { x: 1, y: 0 })).toEqual({
      forward: true,
      left: false,
      right: true,
      fire: false,
    })
  })

  it('turns left when the drag is to the left of the bow', () => {
    expect(controlsFromStick(0, { x: -1, y: 0 })).toEqual({
      forward: true,
      left: true,
      right: false,
      fire: false,
    })
  })

  it('stops when the finger is released', () => {
    expect(controlsFromStick(0, null)).toEqual({
      forward: false,
      left: false,
      right: false,
      fire: false,
    })
  })
})

describe('stickFromDrag', () => {
  it('returns null inside the dead zone', () => {
    expect(stickFromDrag(4, 4, 56)).toBeNull()
  })

  it('points along the drag and stays inside the pad', () => {
    expect(stickFromDrag(0, -112, 56)).toEqual({ x: 0, y: -1 })
  })
})
