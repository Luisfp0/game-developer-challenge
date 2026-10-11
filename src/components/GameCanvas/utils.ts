import { Sprite, Texture } from "pixi.js"
import { EXPLODE_SECONDS, HIT_SECONDS, SHOT_SECONDS } from "./constants"
import { BurstKind, Flames } from "./types"
import { hullFlames } from "../../game/effects"

export const burstLife = (kind: BurstKind): number => {
  if (kind === 'explode') return EXPLODE_SECONDS
  if (kind === 'hit') return HIT_SECONDS
  return SHOT_SECONDS
}

export const burstScale = (kind: BurstKind): number => {
  if (kind === 'shot') return 0.45
  if (kind === 'hit') return 0.7
  return 1
}

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