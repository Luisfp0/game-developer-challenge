import { useEffect, useRef, useState } from 'react'
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { ASSET_URLS } from '../../constants/assets'
import { ARENA_HEIGHT, ARENA_WIDTH, TILE_SIZE } from '../../constants/gameConfig'
import { hullFlames } from '../../game/effects'
import { appliedSeconds } from '../../game/pause'
import { controlsFromTouch } from '../../game/touch'
import { createMatch } from '../../game/simulation'
import { mergeControls } from '../../hooks/useKeyboard'
import type { MatchSnapshot } from '../../types/game'
import type { GameCanvasProps } from './types'

const BAR_SCALE = 0.35
const SHOT_SECONDS = 0.15
const HIT_SECONDS = 0.15
const EXPLODE_SECONDS = 0.4

type BurstKind = 'shot' | 'hit' | 'explode'
type Flames = { one: Sprite; two: Sprite }

function burstLife(kind: BurstKind): number {
  if (kind === 'explode') return EXPLODE_SECONDS
  if (kind === 'hit') return HIT_SECONDS
  return SHOT_SECONDS
}

function burstScale(kind: BurstKind): number {
  if (kind === 'shot') return 0.45
  if (kind === 'hit') return 0.7
  return 1
}

function attachFlames(ship: Sprite, fire1: Texture, fire2: Texture): Flames {
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

function showFlames(flames: Flames, health: number, maxHealth: number): void {
  const count = hullFlames(health, maxHealth)
  flames.one.visible = count >= 1
  flames.two.visible = count >= 2
}

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

export function GameCanvas({
  onSnapshot,
  onLoadError,
  pausedRef,
  keyboardRef,
  touchRef,
  matchSeconds,
  spawnIntervalSeconds,
}: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onSnapshotRef = useRef(onSnapshot)
  const onLoadErrorRef = useRef(onLoadError)
  const [loading, setLoading] = useState<{ loaded: number; total: number } | null>({
    loaded: 0,
    total: Object.keys(ASSET_URLS).length,
  })
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
        const entries = Object.entries(ASSET_URLS)
        const loadedTextures: Partial<Record<keyof typeof ASSET_URLS, Texture>> = {}
        let loaded = 0
        if (alive) setLoading({ loaded, total: entries.length })
        await Promise.all(
          entries.map(async ([key, url]) => {
            const texture = await Assets.load<Texture>(url)
            loadedTextures[key as keyof typeof ASSET_URLS] = texture
            loaded += 1
            if (alive) setLoading({ loaded, total: entries.length })
          }),
        )
        textures = loadedTextures as Record<keyof typeof ASSET_URLS, Texture>
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

      const match = createMatch({ matchSeconds, spawnIntervalSeconds })
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
      const playerFlames = attachFlames(player, textures.fire1, textures.fire2)
      const shots = Array.from({ length: 7 }, () => {
        const sprite = new Sprite(textures.cannonball)
        sprite.anchor.set(0.5)
        sprite.visible = false
        return sprite
      })
      const playerBar = healthBar(textures.playerHealthFrame, textures.playerHealthFill)
      const enemyViews = new Map<number, { sprite: Sprite; bar: HealthBar; flames: Flames }>()
      const effects = new Container()
      const explosionTextures = [textures.explosion1, textures.explosion2, textures.explosion3]
      const burstPool: Sprite[] = []
      const bursts: { sprite: Sprite; kind: BurstKind; age: number }[] = []
      world.addChild(player, ...shots, playerBar.view, effects)

      function spawnBurst(x: number, y: number, kind: BurstKind) {
        let sprite = burstPool.find((item) => !item.visible)
        if (!sprite) {
          sprite = new Sprite(explosionTextures[0])
          sprite.anchor.set(0.5)
          effects.addChild(sprite)
          burstPool.push(sprite)
        }
        sprite.texture = explosionTextures[0]
        sprite.position.set(x, y)
        sprite.scale.set(burstScale(kind))
        sprite.visible = true
        bursts.push({ sprite, kind, age: 0 })
      }

      function tickBursts(dt: number) {
        for (let index = bursts.length - 1; index >= 0; index -= 1) {
          const burst = bursts[index]
          burst.age += dt
          if (burst.age >= burstLife(burst.kind)) {
            burst.sprite.visible = false
            bursts.splice(index, 1)
            continue
          }
          if (burst.kind === 'explode') {
            const frame = Math.min(2, Math.floor((burst.age / EXPLODE_SECONDS) * 3))
            burst.sprite.texture = explosionTextures[frame]
          }
        }
      }

      let previous: MatchSnapshot | null = null

      const draw = (snap: MatchSnapshot) => {
        if (previous) {
          for (const shot of snap.projectiles) {
            if (!previous.projectiles.some((prior) => prior.id === shot.id)) {
              spawnBurst(shot.x, shot.y, 'shot')
            }
          }
          if (previous.ship.health > 0 && snap.ship.health <= 0) {
            spawnBurst(snap.ship.x, snap.ship.y, 'explode')
          } else if (snap.ship.health > 0 && snap.ship.health < previous.ship.health) {
            spawnBurst(snap.ship.x, snap.ship.y, 'hit')
          }
          for (const enemy of snap.enemies) {
            const prior = previous.enemies.find((item) => item.id === enemy.id)
            if (!prior) continue
            if (prior.alive && !enemy.alive) spawnBurst(enemy.x, enemy.y, 'explode')
            else if (enemy.alive && enemy.health < prior.health) spawnBurst(enemy.x, enemy.y, 'hit')
          }
        }
        previous = snap

        island.position.set(snap.island.x, snap.island.y)
        const shipAlive = snap.ship.health > 0
        player.visible = shipAlive
        playerBar.view.visible = shipAlive
        if (shipAlive) {
          player.position.set(snap.ship.x, snap.ship.y)
          player.rotation = snap.ship.rotation
          showFlames(playerFlames, snap.ship.health, snap.ship.maxHealth)
          playerBar.setRatio(snap.ship.maxHealth === 0 ? 0 : snap.ship.health / snap.ship.maxHealth)
          playerBar.view.position.set(snap.ship.x - playerBar.width / 2, snap.ship.y - 58)
        }
        for (const enemy of snap.enemies) {
          let view = enemyViews.get(enemy.id)
          if (!view) {
            const sprite = new Sprite(enemy.kind === 'shooter' ? textures.shooterShip : textures.chaserShip)
            sprite.anchor.set(0.5)
            const flames = attachFlames(sprite, textures.fire1, textures.fire2)
            const bar = healthBar(textures.enemyHealthFrame, textures.enemyHealthFill)
            world.addChild(sprite, bar.view)
            view = { sprite, bar, flames }
            enemyViews.set(enemy.id, view)
          }
          view.sprite.visible = enemy.alive
          view.bar.view.visible = enemy.alive
          if (!enemy.alive) continue
          view.sprite.position.set(enemy.x, enemy.y)
          view.sprite.rotation = enemy.rotation
          showFlames(view.flames, enemy.health, enemy.maxHealth)
          view.bar.setRatio(enemy.maxHealth === 0 ? 0 : enemy.health / enemy.maxHealth)
          view.bar.view.position.set(enemy.x - view.bar.width / 2, enemy.y - 58)
        }
        while (shots.length < snap.projectiles.length) {
          const sprite = new Sprite(textures.cannonball)
          sprite.anchor.set(0.5)
          sprite.visible = false
          shots.push(sprite)
          world.addChild(sprite)
        }
        shots.forEach((sprite, index) => {
          const projectile = snap.projectiles[index]
          sprite.visible = projectile !== undefined
          if (projectile) sprite.position.set(projectile.x, projectile.y)
        })
        world.addChild(effects)
      }

      draw(match.snapshot())
      if (alive) setLoading(null)
      let resultTimer = 0
      const unsubscribe = match.subscribe((snap) => {
        if (snap.phase !== 'result' || snap.endReason !== 'destroyed') {
          onSnapshotRef.current(snap)
          return
        }
        resultTimer = window.setTimeout(() => {
          if (alive) onSnapshotRef.current(snap)
        }, EXPLODE_SECONDS * 1000)
      })

      const tick = () => {
        const seconds = appliedSeconds(next.ticker.deltaMS / 1000, pausedRef.current || document.hidden)
        if (seconds === 0) return
        tickBursts(seconds)
        const touch = controlsFromTouch(match.snapshot().ship.rotation, touchRef.current)
        const snap = match.update(seconds, mergeControls(keyboardRef.current, touch))
        draw(snap)
      }
      next.ticker.add(tick)
      stop = () => {
        window.clearTimeout(resultTimer)
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
  }, [pausedRef, keyboardRef, touchRef, matchSeconds, spawnIntervalSeconds])

  return (
    <div ref={hostRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading ? (
        <div
          role="status"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <p>Loading artwork</p>
          <p>
            {loading.loaded} of {loading.total}
          </p>
        </div>
      ) : null}
    </div>
  )
}
