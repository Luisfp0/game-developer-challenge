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

export type MatchSeed = {
  ship?: Partial<Pick<Ship, 'x' | 'y' | 'rotation'>>
  chaser?: Partial<Pick<Enemy, 'x' | 'y'>>
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

export function createMatch(seed?: MatchSeed): Match {
  const ship = createShip(seed?.ship)
  const chaser = createChaser(seed?.chaser)
  const projectiles: Projectile[] = []
  let score = 0
  let remainingSeconds: number = GAME_CONFIG.matchSeconds
  let phase: MatchSnapshot['phase'] = 'playing'
  let endReason: MatchSnapshot['endReason'] = null
  const cooldown = { front: 0, left: 0, right: 0 }
  let nextId = 2
  const listeners = new Set<(snapshot: MatchSnapshot) => void>()
  let notified = ''

  function snapshot(): MatchSnapshot {
    return {
      phase,
      score,
      remainingSeconds,
      timePlayedSeconds: GAME_CONFIG.matchSeconds - Math.max(remainingSeconds, 0),
      playerHealth: ship.health,
      endReason,
      ship: { ...ship },
      enemies: [{ ...chaser }],
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
      cooldown[weapon] === 0 && projectiles.every((shot) => shot.weapon !== weapon)

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

    const chaserWasAlive = chaser.alive
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const shot = projectiles[i]
      shot.x += shot.vx * dt
      shot.y += shot.vy * dt
      const outside =
        shot.x < 0 || shot.y < 0 || shot.x > ARENA_WIDTH || shot.y > ARENA_HEIGHT
      const hitIsland = circleHitsRect(shot, ISLAND)
      const hitChaser = chaserWasAlive && circlesOverlap(shot, chaser)
      if (hitChaser) {
        const hadHealth = chaser.health > 0
        chaser.health -= shot.damage
        if (hadHealth && chaser.health <= 0) {
          chaser.alive = false
          chaser.health = 0
          score += 1
        } else if (chaser.health < 0) {
          chaser.health = 0
        }
      }
      if (outside || hitIsland || hitChaser) projectiles.splice(i, 1)
    }

    if (chaser.alive) {
      const dx = ship.x - chaser.x
      const dy = ship.y - chaser.y
      const length = Math.hypot(dx, dy) || 1
      chaser.rotation = Math.atan2(dx, -dy)
      tryMove(
        chaser,
        chaser.x + (dx / length) * GAME_CONFIG.chaserSpeed * dt,
        chaser.y + (dy / length) * GAME_CONFIG.chaserSpeed * dt,
      )
      if (circlesOverlap(ship, chaser)) {
        ship.health = Math.max(0, ship.health - GAME_CONFIG.ramDamage)
        chaser.alive = false
        chaser.health = 0
        if (ship.health <= 0) end('destroyed')
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
