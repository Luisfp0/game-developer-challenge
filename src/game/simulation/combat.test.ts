import { describe, expect, it } from 'vitest'
import { GAME_CONFIG, ISLAND, PLAYER_START } from '../../constants/gameConfig'
import { createMatch } from './index'

const idle = {
  forward: false,
  left: false,
  right: false,
  fire: false,
  fireLeft: false,
  fireRight: false,
}

describe('combat', () => {
  it('ends by time without moving the world', () => {
    const match = createMatch()
    const before = match.snapshot()
    const after = match.update(GAME_CONFIG.matchSeconds, idle)
    expect(after.phase).toBe('result')
    expect(after.endReason).toBe('time')
    expect(after.score).toBe(0)
    expect(after.playerHealth).toBe(3)
    expect(after.ship.x).toBe(before.ship.x)
    expect(after.ship.y).toBe(before.ship.y)
  })

  it('drops the chaser to half health on the first shot and destroys it on the second', () => {
    const match = createMatch({
      ship: { x: 200, y: 400, rotation: 0 },
      chaser: { x: 200, y: 250 },
    })
    const fireUntilHit = () => {
      match.update(0.016, { ...idle, fire: true })
      let snap = match.snapshot()
      for (let i = 0; i < 40 && snap.projectiles.length > 0; i += 1) {
        snap = match.update(0.05, idle)
      }
      return snap
    }

    let snap = fireUntilHit()
    expect(snap.score).toBe(0)
    expect(snap.phase).toBe('playing')
    expect(snap.enemies[0].alive).toBe(true)
    expect(snap.enemies[0].health).toBe(GAME_CONFIG.chaserHealth / 2)

    for (let elapsed = 0; elapsed < GAME_CONFIG.shotCooldownSeconds; elapsed += 0.05) {
      match.update(0.05, idle)
    }
    snap = fireUntilHit()
    expect(snap.score).toBe(1)
    expect(snap.enemies[0].alive).toBe(false)
    expect(snap.enemies[0].health).toBe(0)
    expect(snap.phase).toBe('playing')
  })

  it('ends with no score when the chaser rams the player', () => {
    const match = createMatch({
      chaser: { x: PLAYER_START.x, y: PLAYER_START.y },
    })
    const snap = match.update(0.016, idle)
    expect(snap.playerHealth).toBe(0)
    expect(snap.score).toBe(0)
    expect(snap.phase).toBe('result')
    expect(snap.endReason).toBe('destroyed')
    expect(snap.enemies[0].alive).toBe(false)
  })

  it('removes a shot that hits the island', () => {
    const match = createMatch({
      ship: { x: ISLAND.x + 32, y: ISLAND.y + ISLAND.height + 40, rotation: 0 },
    })
    match.update(0.016, { ...idle, fire: true })
    let snap = match.snapshot()
    for (let i = 0; i < 30; i += 1) snap = match.update(0.05, idle)
    expect(snap.projectiles).toHaveLength(0)
    expect(snap.score).toBe(0)
  })

  it('does not fire a second shot while one is alive', () => {
    const match = createMatch()
    match.update(0.016, { ...idle, fire: true })
    match.update(GAME_CONFIG.shotCooldownSeconds, { ...idle, fire: true })
    expect(match.snapshot().projectiles).toHaveLength(1)
  })

  it('fires the front shot and a left volley together', () => {
    const match = createMatch({
      ship: { x: 200, y: 400, rotation: 0 },
      chaser: { x: 800, y: 100 },
    })
    const snap = match.update(0.016, { ...idle, fire: true, fireLeft: true })
    const left = snap.projectiles.filter((shot) => shot.weapon === 'left')
    expect(snap.projectiles).toHaveLength(4)
    expect(left).toHaveLength(3)
    expect(new Set(left.map((shot) => shot.vx)).size).toBe(1)
    expect(new Set(left.map((shot) => shot.y)).size).toBe(3)
  })

  it('does not fire the same side again while its balls are still in the air', () => {
    const match = createMatch({
      ship: { x: 200, y: 400, rotation: 0 },
      chaser: { x: 800, y: 100 },
    })
    match.update(0.016, { ...idle, fireLeft: true })
    for (let step = 0; step < 9; step += 1) match.update(0.05, idle)
    const before = match.snapshot().projectiles.filter((shot) => shot.weapon === 'left')
    expect(before.length).toBeGreaterThan(0)
    match.update(0.016, { ...idle, fireLeft: true })
    const after = match.snapshot().projectiles.filter((shot) => shot.weapon === 'left')
    expect(after).toHaveLength(before.length)
  })

  it('counts every ball of a volley that hits in the same frame', () => {
    const match = createMatch({
      ship: { x: 200, y: 400, rotation: 0 },
      chaser: { x: 164, y: 400 },
    })
    const snap = match.update(0.016, { ...idle, fireLeft: true })
    expect(snap.projectiles).toHaveLength(0)
    expect(snap.enemies[0].health).toBe(0)
    expect(snap.enemies[0].alive).toBe(false)
    expect(snap.score).toBe(1)
    expect(snap.phase).toBe('playing')
  })
})
