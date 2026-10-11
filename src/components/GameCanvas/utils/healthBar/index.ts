import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { opaqueInset } from '../opaqueInset'
import { BAR_SCALE } from './constants'
import type { HealthBar } from './types'

export const healthBar = (frame: Texture, fill: Texture): HealthBar => {
  const view = new Container()
  const frameSprite = new Sprite(frame)
  const fillSprite = new Sprite(fill)
  frameSprite.scale.set(BAR_SCALE)
  fillSprite.scale.set(BAR_SCALE)
  const inset = opaqueInset(fill)
  const mask = new Graphics()
  fillSprite.mask = mask
  view.addChild(frameSprite, fillSprite, mask)
  const setRatio = (ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio))
    mask.clear()
    mask
      .rect(inset.x * BAR_SCALE, inset.y * BAR_SCALE, inset.width * BAR_SCALE * clamped, inset.height * BAR_SCALE)
      .fill(0xffffff)
  }
  setRatio(1)
  return { view, width: frame.width * BAR_SCALE, setRatio }
}
