import { describe, expect, it } from 'vitest'
import { controlsFromKeys } from './index'

describe('controlsFromKeys', () => {
  it('maps sailing keys', () => {
    const keys = new Set(['KeyW', 'ArrowLeft', 'Space'])
    expect(controlsFromKeys(keys)).toEqual({
      forward: true,
      left: true,
      right: false,
      fire: true,
    })
  })

  it('treats arrows and WASD as the same actions', () => {
    const keys = new Set(['ArrowUp', 'KeyD'])
    expect(controlsFromKeys(keys)).toEqual({
      forward: true,
      left: false,
      right: true,
      fire: false,
    })
  })
})
