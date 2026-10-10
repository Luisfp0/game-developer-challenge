import { describe, expect, it } from 'vitest'
import { controlsFromKeys, mergeControls } from './index'

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

describe('mergeControls', () => {
  it('keeps a command held by only one source', () => {
    expect(
      mergeControls(
        { forward: true, left: false, right: false, fire: false },
        { forward: false, left: true, right: false, fire: true },
      ),
    ).toEqual({
      forward: true,
      left: true,
      right: false,
      fire: true,
    })
  })
})
