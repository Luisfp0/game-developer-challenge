import { describe, expect, it } from 'vitest'
import { sideVolley } from './index'

const shot = {
  x: 200,
  y: 400,
  rotation: 0,
  muzzle: 36,
  spread: 16,
  speed: 320,
}

describe('side volley', () => {
  it('places three balls along the left side', () => {
    expect(sideVolley({ ...shot, side: 'left' })).toEqual([
      { x: 164, y: 416, vx: -320, vy: 0 },
      { x: 164, y: 400, vx: -320, vy: 0 },
      { x: 164, y: 384, vx: -320, vy: 0 },
    ])
  })

  it('places three balls along the right side', () => {
    expect(sideVolley({ ...shot, side: 'right' })).toEqual([
      { x: 236, y: 416, vx: 320, vy: 0 },
      { x: 236, y: 400, vx: 320, vy: 0 },
      { x: 236, y: 384, vx: 320, vy: 0 },
    ])
  })
})
