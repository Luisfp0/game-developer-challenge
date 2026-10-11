import { Sprite, Texture } from 'pixi.js'
import { hullFlames } from '../../../../game/effects'
import type { Flames } from './types'

export const attachFlames = (ship: Sprite, fire1: Texture, fire2: Texture): Flames => {
  const one = new Sprite(fire1)
  const two = new Sprite(fire2)
  one.anchor.set(0.5)
  two.anchor.set(0.5)
  one.position.set(0, 22)
  two.position.set(-12, 30)
  one.visible = false
  two.visible = false
  ship.addChild(one, two)
  return { one, two }
}

export const showFlames = (flames: Flames, health: number, maxHealth: number): void => {
  const count = hullFlames(health, maxHealth)
  flames.one.visible = count >= 1
  flames.two.visible = count >= 2
}
