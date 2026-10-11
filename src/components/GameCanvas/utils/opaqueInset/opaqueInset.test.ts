import { describe, expect, it } from 'vitest'
import { opaqueBounds } from './index'

const pixels = (width: number, height: number, opaque: Array<[number, number]>): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(width * height * 4)
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = 255
  return data
}

describe('opaqueBounds', () => {
  it('uses the whole image when every pixel is clear', () => {
    expect(opaqueBounds(pixels(2, 3, []), 2, 3)).toEqual({ x: 0, y: 0, width: 2, height: 3 })
  })

  it('shrinks to the opaque pixels', () => {
    expect(opaqueBounds(pixels(3, 3, [[1, 0], [2, 1]]), 3, 3)).toEqual({ x: 1, y: 0, width: 2, height: 2 })
  })

  it('treats a faint pixel as clear', () => {
    const data = pixels(1, 1, [])
    data[3] = 16
    expect(opaqueBounds(data, 1, 1)).toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })
})
