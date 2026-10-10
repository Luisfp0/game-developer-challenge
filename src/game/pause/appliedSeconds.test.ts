import { describe, expect, it } from 'vitest'
import { appliedSeconds } from './index'

describe('appliedSeconds', () => {
  it('returns 0 while paused so hidden time is not subtracted', () => {
    expect(appliedSeconds(40, true)).toBe(0)
  })

  it('returns the elapsed time while the match is running', () => {
    expect(appliedSeconds(0.016, false)).toBe(0.016)
  })
})
