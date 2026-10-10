import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  CHASER_START,
  GAME_CONFIG,
  ISLAND,
  PLAYER_START,
} from '../../constants/gameConfig'
import type { Enemy } from '../../types/enemy'
import type { HeldControls, MatchSnapshot } from '../../types/game'
import type { Projectile } from '../../types/projectile'
import type { Ship } from '../../types/ship'
import { sideVolley } from '../broadside'
import { circleHitsRect, circlesOverlap, clampToArena } from '../collision'
import { spawnPoint } from '../spawn'

export type MatchSeed = {
  ship?: Partial<Pick<Ship, 'x' | 'y' | 'rotation'>>
  chaser?: Partial<Pick<Enemy, 'x' | 'y'>>
  shooters?: { x: number; y: number }[]
  matchSeconds?: number
  spawnIntervalSeconds?: number
}

export type Match = {
  snapshot: () => MatchSnapshot
  update: (dtSeconds: number, controls: HeldControls) => MatchSnapshot
  subscribe: (listener: (snapshot: MatchSnapshot) => void) => () => void
}

function facing(rotation: number): { x: number; y: number } {
  return { x: Math.sin(rotation), y: -Math.cos(rotation) }
}

function createShip(seed?: MatchSeed['ship']): Ship {
  return {
    x: seed?.x ?? PLAYER_START.x,
    y: seed?.y ?? PLAYER_START.y,
    rotation: seed?.rotation ?? PLAYER_START.rotation,
    health: GAME_CONFIG.playerHealth,
    maxHealth: GAME_CONFIG.playerHealth,
    radius: GAME_CONFIG.shipRadius,
  }
}

function createChaser(seed?: MatchSeed['chaser']): Enemy {
  return {
    id: 1,
    kind: 'chaser',
    x: seed?.x ?? CHASER_START.x,
    y: seed?.y ?? CHASER_START.y,
    rotation: 0,
    health: GAME_CONFIG.chaserHealth,
    maxHealth: GAME_CONFIG.chaserHealth,
    radius: GAME_CONFIG.shipRadius,
    alive: true,
  }
}

function clampMatchSeconds(requested?: number): number {
  if (requested === undefined) return GAME_CONFIG.matchSeconds
  return Math.min(
    GAME_CONFIG.matchSecondsMax,
    Math.max(GAME_CONFIG.matchSecondsMin, requested),
  )
}

function clampSpawnInterval(requested?: number): number {
  if (requested === undefined) return GAME_CONFIG.spawnIntervalSeconds
  return Math.min(
    GAME_CONFIG.spawnIntervalMax,
    Math.max(GAME_CONFIG.spawnIntervalMin, requested),
  )
}

export function createMatch(seed?: MatchSeed): Match {
  const ship = createShip(seed?.ship)
  const enemies: Enemy[] = [createChaser(seed?.chaser)]
  const projectiles: Projectile[] = []
  const shooterCooldown = new Map<number, number>()
  let score = 0
  const matchSeconds = clampMatchSeconds(seed?.matchSeconds)
  const spawnIntervalSeconds = clampSpawnInterval(seed?.spawnIntervalSeconds)
  let remainingSeconds = matchSeconds
  let phase: MatchSnapshot['phase'] = 'playing'
  let endReason: MatchSnapshot['endReason'] = null
  const cooldown = { front: 0, left: 0, right: 0 }
  let nextId = 2
  let spawnClock = 0
  let spawnStartIndex = 0
  let nextSpawnKind: Enemy['kind'] = 'shooter'
  for (const spot of seed?.shooters ?? []) {
    const shooter: Enemy = {
      id: nextId,
      kind: 'shooter',
      x: spot.x,
      y: spot.y,
      rotation: 0,
      health: GAME_CONFIG.shooterHealth,
      maxHealth: GAME_CONFIG.shooterHealth,
      radius: GAME_CONFIG.shipRadius,
      alive: true,
    }
    nextId += 1
    enemies.push(shooter)
    shooterCooldown.set(shooter.id, 0)
  }
  const listeners = new Set<(snapshot: MatchSnapshot) => void>()
  let notified = ''

  function snapshot(): MatchSnapshot {
    return {
      phase,
      score,
      remainingSeconds,
      timePlayedSeconds: matchSeconds - Math.max(remainingSeconds, 0),
      playerHealth: ship.health,
      endReason,
      ship: { ...ship },
      enemies: enemies.map((enemy) => ({ ...enemy })),
      projectiles: projectiles.map((shot) => ({ ...shot })),
      island: { ...ISLAND },
    }
  }

  function notify(): void {
    const current = snapshot()
    const key = [
      current.phase,
      current.score,
      Math.ceil(current.remainingSeconds),
      current.playerHealth,
    ].join(':')
    if (key === notified) return
    notified = key
    listeners.forEach((listener) => listener(current))
  }

  function end(reason: NonNullable<MatchSnapshot['endReason']>): void {
    phase = 'result'
    endReason = reason
    remainingSeconds = Math.max(remainingSeconds, 0)
  }

  function tryMove(body: { x: number; y: number; radius: number }, nx: number, ny: number): void {
    const clamped = clampToArena(nx, ny, body.radius, ARENA_WIDTH, ARENA_HEIGHT)
    if (!circleHitsRect({ ...clamped, radius: body.radius }, ISLAND)) {
      body.x = clamped.x
      body.y = clamped.y
    }
  }

  function update(dtSeconds: number, controls: HeldControls): MatchSnapshot {
    if (phase !== 'playing') return snapshot()
    const elapsed = Math.max(dtSeconds, 0)
    const dt = Math.min(elapsed, 0.05)
    remainingSeconds -= elapsed
    if (remainingSeconds <= 0) {
      end('time')
      notify()
      return snapshot()
    }

    if (controls.left) ship.rotation -= GAME_CONFIG.rotationSpeed * dt
    if (controls.right) ship.rotation += GAME_CONFIG.rotationSpeed * dt
    if (controls.forward) {
      const aim = facing(ship.rotation)
      tryMove(ship, ship.x + aim.x * GAME_CONFIG.shipSpeed * dt, ship.y + aim.y * GAME_CONFIG.shipSpeed * dt)
    }

    cooldown.front = Math.max(0, cooldown.front - dt)
    cooldown.left = Math.max(0, cooldown.left - dt)
    cooldown.right = Math.max(0, cooldown.right - dt)

    const weaponReady = (weapon: Projectile['weapon']) =>
      cooldown[weapon] === 0 &&
      projectiles.every((shot) => shot.owner !== 'player' || shot.weapon !== weapon)

    const pushShot = (weapon: Projectile['weapon'], x: number, y: number, vx: number, vy: number) => {
      projectiles.push({
        id: nextId,
        x,
        y,
        vx,
        vy,
        radius: GAME_CONFIG.projectileRadius,
        damage: GAME_CONFIG.shotDamage,
        weapon,
        owner: 'player',
      })
      nextId += 1
    }

    if (controls.fire && weaponReady('front')) {
      const aim = facing(ship.rotation)
      const muzzle = ship.radius + 8
      pushShot(
        'front',
        ship.x + aim.x * muzzle,
        ship.y + aim.y * muzzle,
        aim.x * GAME_CONFIG.projectileSpeed,
        aim.y * GAME_CONFIG.projectileSpeed,
      )
      cooldown.front = GAME_CONFIG.shotCooldownSeconds
    }
    for (const side of ['left', 'right'] as const) {
      const held = side === 'left' ? controls.fireLeft : controls.fireRight
      if (!held || !weaponReady(side)) continue
      for (const shot of sideVolley({
        x: ship.x,
        y: ship.y,
        rotation: ship.rotation,
        side,
        muzzle: ship.radius + 8,
        spread: 16,
        speed: GAME_CONFIG.projectileSpeed,
      })) {
        pushShot(side, shot.x, shot.y, shot.vx, shot.vy)
      }
      cooldown[side] = GAME_CONFIG.shotCooldownSeconds
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue
      const dx = ship.x - enemy.x
      const dy = ship.y - enemy.y
      const distance = Math.hypot(dx, dy)
      const length = distance || 1
      enemy.rotation = Math.atan2(dx, -dy)
      if (enemy.kind === 'chaser' || distance > GAME_CONFIG.shooterRange) {
        tryMove(
          enemy,
          enemy.x + (dx / length) * GAME_CONFIG.chaserSpeed * dt,
          enemy.y + (dy / length) * GAME_CONFIG.chaserSpeed * dt,
        )
      }
    }

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.kind !== 'shooter') continue
      const remaining = Math.max(0, (shooterCooldown.get(enemy.id) ?? 0) - dt)
      shooterCooldown.set(enemy.id, remaining)
      const distance = Math.hypot(ship.x - enemy.x, ship.y - enemy.y)
      if (remaining > 0 || distance > GAME_CONFIG.shooterRange) continue
      const aim = facing(enemy.rotation)
      const muzzle = enemy.radius + 8
      projectiles.push({
        id: nextId,
        x: enemy.x + aim.x * muzzle,
        y: enemy.y + aim.y * muzzle,
        vx: aim.x * GAME_CONFIG.projectileSpeed,
        vy: aim.y * GAME_CONFIG.projectileSpeed,
        radius: GAME_CONFIG.projectileRadius,
        damage: GAME_CONFIG.shotDamage,
        weapon: 'front',
        owner: 'enemy',
      })
      nextId += 1
      shooterCooldown.set(enemy.id, GAME_CONFIG.shooterCooldownSeconds)
    }

    const aliveAtStart = new Set(enemies.filter((enemy) => enemy.alive))
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const shot = projectiles[i]
      shot.x += shot.vx * dt
      shot.y += shot.vy * dt
      const outside =
        shot.x < 0 || shot.y < 0 || shot.x > ARENA_WIDTH || shot.y > ARENA_HEIGHT
      const hitIsland = circleHitsRect(shot, ISLAND)
      let spent = false
      if (!outside && !hitIsland) {
        if (shot.owner === 'player') {
          const target = enemies.find(
            (enemy) => aliveAtStart.has(enemy) && circlesOverlap(shot, enemy),
          )
          if (target) {
            spent = true
            const hadHealth = target.health > 0
            target.health -= shot.damage
            if (hadHealth && target.health <= 0) {
              target.alive = false
              target.health = 0
              score += 1
            } else if (target.health < 0) {
              target.health = 0
            }
          }
        } else if (circlesOverlap(shot, ship)) {
          spent = true
          ship.health = Math.max(0, ship.health - shot.damage)
        }
      }
      if (outside || hitIsland || spent) projectiles.splice(i, 1)
    }

    if (ship.health <= 0) {
      end('destroyed')
      notify()
      return snapshot()
    }

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.kind !== 'chaser' || !circlesOverlap(ship, enemy)) continue
      ship.health = Math.max(0, ship.health - GAME_CONFIG.ramDamage)
      enemy.alive = false
      enemy.health = 0
    }
    if (ship.health <= 0) end('destroyed')

    if (phase === 'playing') {
      spawnClock += elapsed
      while (spawnClock >= spawnIntervalSeconds) {
        spawnClock -= spawnIntervalSeconds
        const point = spawnPoint({
          x: ship.x,
          y: ship.y,
          enemies,
          startIndex: spawnStartIndex,
          minPlayerDistance: GAME_CONFIG.spawnPlayerDistance,
          minShipDistance: GAME_CONFIG.spawnShipDistance,
          shipRadius: GAME_CONFIG.shipRadius,
          island: ISLAND,
        })
        if (!point) continue
        const health =
          nextSpawnKind === 'shooter' ? GAME_CONFIG.shooterHealth : GAME_CONFIG.chaserHealth
        const born: Enemy = {
          id: nextId,
          kind: nextSpawnKind,
          x: point.x,
          y: point.y,
          rotation: 0,
          health,
          maxHealth: health,
          radius: GAME_CONFIG.shipRadius,
          alive: true,
        }
        nextId += 1
        enemies.push(born)
        if (born.kind === 'shooter') shooterCooldown.set(born.id, 0)
        nextSpawnKind = nextSpawnKind === 'shooter' ? 'chaser' : 'shooter'
        spawnStartIndex = point.nextIndex
      }
    }

    notify()
    return snapshot()
  }

  return {
    snapshot,
    update,
    subscribe(listener) {
      listeners.add(listener)
      listener(snapshot())
      return () => listeners.delete(listener)
    },
  }
}
