import { Texture } from 'pixi.js'

export type OpaqueRect = { x: number; y: number; width: number; height: number }

export const opaqueBounds = (pixels: Uint8ClampedArray, width: number, height: number): OpaqueRect => {
  const full = { x: 0, y: 0, width, height }
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= 16) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX) return full
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

export const opaqueInset = (texture: Texture): OpaqueRect => {
  const width = texture.width
  const height = texture.height
  const full = { x: 0, y: 0, width, height }
  const resource = texture.source.resource
  if (!resource) return full
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return full
  context.drawImage(resource as CanvasImageSource, 0, 0, width, height)
  return opaqueBounds(context.getImageData(0, 0, width, height).data, width, height)
}
