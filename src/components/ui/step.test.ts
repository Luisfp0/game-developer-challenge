import { describe, expect, it } from 'vitest'
import { stepWhole } from './step'

describe('stepWhole', () => {
  it('steps inside the range', () => {
    expect(stepWhole('60', 1, 60, 180, 10)).toBe('70')
    expect(stepWhole('12', 1, 5, 30, 1)).toBe('13')
  })

  it('stays on the limit', () => {
    expect(stepWhole('180', 1, 60, 180, 10)).toBe('180')
    expect(stepWhole('60', -1, 60, 180, 10)).toBe('60')
    expect(stepWhole('30', 1, 5, 30, 1)).toBe('30')
    expect(stepWhole('5', -1, 5, 30, 1)).toBe('5')
  })

  it('pulls an out-of-range number back inside', () => {
    expect(stepWhole('3', 1, 5, 30, 1)).toBe('5')
    expect(stepWhole('200', -1, 60, 180, 10)).toBe('180')
  })

  it('replaces a broken value with the minimum', () => {
    expect(stepWhole('abc', 1, 60, 180, 10)).toBe('60')
  })
})
