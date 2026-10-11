import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  GAME_CONFIG,
  ISLANDS,
  TILE_SIZE,
} from '../../constants/gameConfig'
import type { Enemy } from '../../types/enemy'
import type { HeldControls, MatchSnapshot } from '../../types/game'
import type { Projectile } from '../../types/projectile'
import { sideVolley } from '../broadside'
import { circleHitsRoundRect, circlesOverlap, clampToArena, pushOutOfRoundRect } from '../collision'
import { spawnPoint } from '../spawn'
import type { Match, MatchSeed } from './types'
import { clampMatchSeconds, clampSpawnInterval } from './utils/clampConfig'
import { facing } from './utils/facing'
import { createChaser, createShip } from './utils/ships'

export type { Match, MatchSeed }

export const createMatch = (seed?: MatchSeed): Match => {
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
  const wallSide = new Map<number, number>()
  const listeners = new Set<(snapshot: MatchSnapshot) => void>()
  let notified = ''

  const snapshot = (): MatchSnapshot => {
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
      islands: ISLANDS.map((island) => ({ ...island })),
    }
  }

  const notify = (): void => {
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

  const end = (reason: NonNullable<MatchSnapshot['endReason']>): void => {
    phase = 'result'
    endReason = reason
    remainingSeconds = Math.max(remainingSeconds, 0)
  }

  const offTheSand = (x: number, y: number, radius: number): { x: number; y: number } => {
    let px = x
    let py = y
    for (const island of ISLANDS) {
      const freed = pushOutOfRoundRect({ x: px, y: py, radius }, island, TILE_SIZE)
      if (freed) {
        px = freed.x
        py = freed.y
      }
    }
    return { x: px, y: py }
  }

  const hitsSand = (x: number, y: number, radius: number): boolean => {
    return ISLANDS.some((island) => circleHitsRoundRect({ x, y, radius }, island, TILE_SIZE))
  }

  const tryMove = (
    body: { x: number; y: number; radius: number },
    nx: number,
    ny: number,
    around?: { id: number; goalX: number; goalY: number },
  ): void => {
    const radius = body.radius
    const clamped = clampToArena(nx, ny, radius, ARENA_WIDTH, ARENA_HEIGHT)
    if (!hitsSand(clamped.x, clamped.y, radius)) {
      if (around) wallSide.delete(around.id)
      body.x = clamped.x
      body.y = clamped.y
      return
    }
    const freed = offTheSand(clamped.x, clamped.y, radius)
    const outwardX = freed.x - clamped.x
    const outwardY = freed.y - clamped.y
    const outward = Math.hypot(outwardX, outwardY) || 1
    const tx = -outwardY / outward
    const ty = outwardX / outward
    const dx = clamped.x - body.x
    const dy = clamped.y - body.y
    const speed = Math.hypot(dx, dy)
    if (!around) {
      const along = dx * tx + dy * ty
      const sign = Math.abs(along) > speed * 0.02 ? Math.sign(along) : 0
      const slid =
        sign === 0
          ? freed
          : offTheSand(body.x + tx * sign * speed, body.y + ty * sign * speed, radius)
      const fitted = clampToArena(slid.x, slid.y, radius, ARENA_WIDTH, ARENA_HEIGHT)
      body.x = fitted.x
      body.y = fitted.y
      return
    }
    let side = wallSide.get(around.id)
    if (side === undefined) {
      const goalX = around.goalX - body.x
      const goalY = around.goalY - body.y
      const towardGoal = goalX * tx + goalY * ty
      if (Math.abs(towardGoal) > 0.01) {
        side = Math.sign(towardGoal)
      } else {
        const island = ISLANDS.find((land) =>
          circleHitsRoundRect({ ...clamped, radius }, land, TILE_SIZE),
        )
        const rx = body.x - ((island?.x ?? 0) + (island?.width ?? 0) / 2)
        const ry = body.y - ((island?.y ?? 0) + (island?.height ?? 0) / 2)
        side = tx * ry + ty * -rx >= 0 ? 1 : -1
      }
      wallSide.set(around.id, side)
    }
    const slid = offTheSand(freed.x + tx * side * speed, freed.y + ty * side * speed, radius)
    const fitted = clampToArena(slid.x, slid.y, radius, ARENA_WIDTH, ARENA_HEIGHT)
    body.x = fitted.x
    body.y = fitted.y
  }

  const update = (dtSeconds: number, controls: HeldControls): MatchSnapshot => {
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
          { id: enemy.id, goalX: ship.x, goalY: ship.y },
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
      const hitIsland = ISLANDS.some((island) => circleHitsRoundRect(shot, island, TILE_SIZE))
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
          islands: ISLANDS,
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
