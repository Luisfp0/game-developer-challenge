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
      fireLeft: false,
      fireRight: false,
    })
  })

  it('treats arrows and WASD as the same actions', () => {
    const keys = new Set(['ArrowUp', 'KeyD'])
    expect(controlsFromKeys(keys)).toEqual({
      forward: true,
      left: false,
      right: true,
      fire: false,
      fireLeft: false,
      fireRight: false,
    })
  })

  it('maps Q and E to the side cannons', () => {
    expect(controlsFromKeys(new Set(['KeyQ', 'KeyE']))).toEqual({
      forward: false,
      left: false,
      right: false,
      fire: false,
      fireLeft: true,
      fireRight: true,
    })
  })
})

describe('mergeControls', () => {
  it('keeps a command held by only one source', () => {
    expect(
      mergeControls(
        { forward: true, left: false, right: false, fire: false, fireLeft: true, fireRight: false },
        { forward: false, left: true, right: false, fire: true, fireLeft: false, fireRight: true },
      ),
    ).toEqual({
      forward: true,
      left: true,
      right: false,
      fire: true,
      fireLeft: true,
      fireRight: true,
    })
  })
})
