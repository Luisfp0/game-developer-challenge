import { useEffect, useRef } from 'react'
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { ASSET_URLS } from '../../constants/assets'
import { ARENA_HEIGHT, ARENA_WIDTH, TILE_SIZE } from '../../constants/gameConfig'
import { appliedSeconds } from '../../game/pause'
import { controlsFromTouch } from '../../game/touch'
import { createMatch } from '../../game/simulation'
import { mergeControls } from '../../hooks/useKeyboard'
import type { MatchSnapshot } from '../../types/game'
import type { GameCanvasProps } from './types'

const BAR_SCALE = 0.35

type HealthBar = {
  view: Container
  width: number
  setRatio: (ratio: number) => void
}

function opaqueInset(texture: Texture): { x: number; y: number; width: number; height: number } {
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
  const pixels = context.getImageData(0, 0, width, height).data
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

function healthBar(frame: Texture, fill: Texture): HealthBar {
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

export function GameCanvas({ onSnapshot, onLoadError, pausedRef, keyboardRef, touchRef }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onSnapshotRef = useRef(onSnapshot)
  const onLoadErrorRef = useRef(onLoadError)
  onSnapshotRef.current = onSnapshot
  onLoadErrorRef.current = onLoadError

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let alive = true
    let app: Application | null = null

    let stop = () => {}

    async function start() {
      const next = new Application()
      try {
        await next.init({
          width: ARENA_WIDTH,
          height: ARENA_HEIGHT,
          background: '#073047',
          antialias: true,
        })
      } catch (error) {
        if (alive) onLoadErrorRef.current(error instanceof Error ? error.message : 'Could not start the canvas')
        return
      }
      if (!alive) {
        next.destroy()
        return
      }
      app = next
      host!.appendChild(next.canvas)
      next.canvas.style.width = '100%'
      next.canvas.style.height = '100%'
      next.canvas.style.objectFit = 'contain'

      let textures: Record<keyof typeof ASSET_URLS, Texture>
      try {
        const entries = await Promise.all(
          Object.entries(ASSET_URLS).map(async ([key, url]) => [key, await Assets.load<Texture>(url)] as const),
        )
        textures = Object.fromEntries(entries) as Record<keyof typeof ASSET_URLS, Texture>
      } catch (error) {
        if (alive) onLoadErrorRef.current(error instanceof Error ? error.message : 'Could not load the artwork')
        return
      }
      if (!alive) return

      const water = new Container()
      for (let y = 0; y < ARENA_HEIGHT; y += TILE_SIZE) {
        for (let x = 0; x < ARENA_WIDTH; x += TILE_SIZE) {
          const tile = new Sprite(textures.water)
          tile.position.set(x, y)
          water.addChild(tile)
        }
      }
      next.stage.addChild(water)

      const match = createMatch()
      const world = new Container()
      next.stage.addChild(world)

      const island = new Container()
      const landA = new Sprite(textures.land)
      const landB = new Sprite(textures.land)
      const landC = new Sprite(textures.land)
      const landD = new Sprite(textures.land)
      landB.x = TILE_SIZE
      landC.y = TILE_SIZE
      landD.position.set(TILE_SIZE, TILE_SIZE)
      island.addChild(landA, landB, landC, landD)
      world.addChild(island)

      const player = new Sprite(textures.playerShip)
      player.anchor.set(0.5)
      const chaser = new Sprite(textures.chaserShip)
      chaser.anchor.set(0.5)
      const shots = Array.from({ length: 7 }, () => {
        const sprite = new Sprite(textures.cannonball)
        sprite.anchor.set(0.5)
        sprite.visible = false
        return sprite
      })
      const playerBar = healthBar(textures.playerHealthFrame, textures.playerHealthFill)
      const chaserBar = healthBar(textures.enemyHealthFrame, textures.enemyHealthFill)
      world.addChild(player, chaser, ...shots, playerBar.view, chaserBar.view)

      const draw = (snap: MatchSnapshot) => {
        island.position.set(snap.island.x, snap.island.y)
        player.position.set(snap.ship.x, snap.ship.y)
        player.rotation = snap.ship.rotation
        const enemy = snap.enemies[0]
        chaser.visible = enemy.alive
        chaser.position.set(enemy.x, enemy.y)
        chaser.rotation = enemy.rotation
        shots.forEach((sprite, index) => {
          const projectile = snap.projectiles[index]
          sprite.visible = projectile !== undefined
          if (projectile) sprite.position.set(projectile.x, projectile.y)
        })
        playerBar.setRatio(snap.ship.maxHealth === 0 ? 0 : snap.ship.health / snap.ship.maxHealth)
        playerBar.view.position.set(snap.ship.x - playerBar.width / 2, snap.ship.y - 58)
        chaserBar.view.visible = enemy.alive
        chaserBar.setRatio(enemy.maxHealth === 0 ? 0 : enemy.health / enemy.maxHealth)
        chaserBar.view.position.set(enemy.x - chaserBar.width / 2, enemy.y - 58)
      }

      draw(match.snapshot())
      const unsubscribe = match.subscribe((snap) => onSnapshotRef.current(snap))

      const tick = () => {
        const seconds = appliedSeconds(next.ticker.deltaMS / 1000, pausedRef.current || document.hidden)
        if (seconds === 0) return
        const touch = controlsFromTouch(match.snapshot().ship.rotation, touchRef.current)
        const snap = match.update(seconds, mergeControls(keyboardRef.current, touch))
        draw(snap)
      }
      next.ticker.add(tick)
      stop = () => {
        next.ticker.remove(tick)
        unsubscribe()
      }
    }

    void start()

    return () => {
      alive = false
      stop()
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [pausedRef, keyboardRef, touchRef])

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
}
