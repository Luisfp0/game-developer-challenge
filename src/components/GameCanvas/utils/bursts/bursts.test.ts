import { describe, expect, it } from 'vitest'
import { EXPLODE_SECONDS } from './constants'
import { burstLife, burstScale, explosionFrame } from './index'

describe('bursts', () => {
  it('keeps a shot and a hit shorter than an explosion', () => {
    expect(burstLife('shot')).toBe(0.15)
    expect(burstLife('hit')).toBe(0.15)
    expect(burstLife('explode')).toBe(0.4)
  })

  it('draws a shot smaller than a hit, and an explosion at full size', () => {
    expect(burstScale('shot')).toBe(0.45)
    expect(burstScale('hit')).toBe(0.7)
    expect(burstScale('explode')).toBe(1)
  })

  it('steps the explosion through three frames and stays on the last', () => {
    expect(explosionFrame(0)).toBe(0)
    expect(explosionFrame(EXPLODE_SECONDS / 3 - 0.001)).toBe(0)
    expect(explosionFrame(EXPLODE_SECONDS / 3)).toBe(1)
    expect(explosionFrame((EXPLODE_SECONDS / 3) * 2)).toBe(2)
    expect(explosionFrame(EXPLODE_SECONDS)).toBe(2)
    expect(explosionFrame(1)).toBe(2)
  })
})
