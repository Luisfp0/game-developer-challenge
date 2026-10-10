import { describe, expect, it } from 'vitest'
import { fittedArenaSize } from './index'

describe('fittedArenaSize', () => {
  it('keeps the arena when the view is the same size', () => {
    expect(fittedArenaSize(1024, 768, 1024, 768)).toEqual({ width: 1024, height: 768 })
  })

  it('fits a wide view by the height', () => {
    expect(fittedArenaSize(1920, 1080, 1024, 768)).toEqual({ width: 1440, height: 1080 })
  })

  it('fits a tall view by the width', () => {
    expect(fittedArenaSize(390, 844, 1024, 768)).toEqual({ width: 390, height: 292.5 })
  })

  it('returns nothing when a measure is empty', () => {
    expect(fittedArenaSize(0, 768, 1024, 768)).toEqual({ width: 0, height: 0 })
    expect(fittedArenaSize(1024, -1, 1024, 768)).toEqual({ width: 0, height: 0 })
  })
})
