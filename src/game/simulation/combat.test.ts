import { describe, expect, it } from 'vitest'
import { GAME_CONFIG, ISLANDS, PLAYER_START } from '../../constants/gameConfig'
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

  it('clamps a requested match shorter than the minimum to 60 seconds', () => {
    expect(createMatch({ matchSeconds: 30 }).snapshot().remainingSeconds).toBe(60)
  })

  it('clamps a requested match longer than the maximum to 180 seconds', () => {
    expect(createMatch({ matchSeconds: 200 }).snapshot().remainingSeconds).toBe(180)
  })

  it('starts a 90 second match with full time remaining and no time played', () => {
    const snap = createMatch({ matchSeconds: 90 }).snapshot()
    expect(snap.remainingSeconds).toBe(90)
    expect(snap.timePlayedSeconds).toBe(0)
  })

  it('keeps a 90 second match playing after 10 seconds', () => {
    const snap = createMatch({ matchSeconds: 90 }).update(10, idle)
    expect(snap.phase).toBe('playing')
    expect(snap.remainingSeconds).toBe(80)
    expect(snap.timePlayedSeconds).toBe(10)
  })

  it('keeps a 90 second match playing after 60 seconds', () => {
    const snap = createMatch({ matchSeconds: 90 }).update(60, idle)
    expect(snap.phase).toBe('playing')
    expect(snap.remainingSeconds).toBe(30)
  })

  it('ends a 90 second match by time after 90 seconds', () => {
    const snap = createMatch({ matchSeconds: 90 }).update(90, idle)
    expect(snap.phase).toBe('result')
    expect(snap.endReason).toBe('time')
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
    const island = ISLANDS[0]
    const match = createMatch({
      ship: { x: island.x + 32, y: island.y + island.height + 40, rotation: 0 },
    })
    match.update(0.016, { ...idle, fire: true })
    let snap = match.snapshot()
    for (let i = 0; i < 30; i += 1) snap = match.update(0.05, idle)
    expect(snap.projectiles).toHaveLength(0)
    expect(snap.score).toBe(0)
  })

  it('removes a shot that hits the lower sand bank', () => {
    const bank = ISLANDS[2]
    const match = createMatch({
      ship: { x: bank.x + 32, y: bank.y + bank.height + 40, rotation: 0 },
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
    expect(match.snapshot().projectiles[0].owner).toBe('player')
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

  describe('shooter', () => {
    const far = { x: 80, y: 700 }

    it('stops inside range and fires one enemy ball', () => {
      const match = createMatch({
        ship: { x: 450, y: 700, rotation: 0 },
        chaser: far,
        shooters: [{ x: 200, y: 700 }],
      })
      const snap = match.update(0.016, idle)
      const shooter = snap.enemies[1]
      expect(shooter.kind).toBe('shooter')
      expect(shooter.x).toBe(200)
      expect(shooter.y).toBe(700)
      expect(snap.projectiles.filter((shot) => shot.owner === 'enemy')).toHaveLength(1)
    })

    it('does not hurt the player or die when touching the player', () => {
      const match = createMatch({
        ship: { x: 450, y: 700, rotation: 0 },
        chaser: far,
        shooters: [{ x: 450, y: 700 }],
      })
      const snap = match.update(0.016, idle)
      expect(snap.enemies[1].alive).toBe(true)
      expect([3, 2]).toContain(snap.playerHealth)
      expect(snap.phase).toBe('playing')
    })

    it('destroys the player with its shots and scores nothing', () => {
      const match = createMatch({
        ship: { x: 900, y: 200, rotation: 0 },
        chaser: far,
        shooters: [{ x: 900, y: 450 }],
      })
      let snap = match.snapshot()
      for (let i = 0; i < 100 && snap.playerHealth > 0; i += 1) {
        snap = match.update(0.05, idle)
      }
      expect(snap.playerHealth).toBe(0)
      expect(snap.score).toBe(0)
      expect(snap.phase).toBe('result')
      expect(snap.endReason).toBe('destroyed')
      expect(snap.enemies[1].alive).toBe(true)
    })

    it('lets an enemy ball pass through another enemy', () => {
      const match = createMatch({
        ship: { x: 450, y: 700, rotation: 0 },
        chaser: { x: 300, y: 700 },
        shooters: [{ x: 200, y: 700 }],
      })
      let snap = match.snapshot()
      for (let i = 0; i < 40 && snap.playerHealth === GAME_CONFIG.playerHealth; i += 1) {
        snap = match.update(0.05, idle)
      }
      expect(snap.enemies[0].health).toBe(GAME_CONFIG.chaserHealth)
      expect(snap.enemies[0].alive).toBe(true)
      expect(snap.playerHealth).toBe(2)
    })

    it('keeps firing every cooldown without waiting for earlier enemy balls', () => {
      const match = createMatch({
        ship: { x: 650, y: 100, rotation: 0 },
        chaser: far,
        shooters: [{ x: 400, y: 100 }],
      })
      const first = match.update(0.016, idle)
      expect(first.enemies[1].x).toBe(400)
      expect(first.enemies[1].y).toBe(100)
      expect(first.projectiles.filter((shot) => shot.owner === 'enemy')).toHaveLength(1)
      for (let i = 0; i < 24; i += 1) match.update(0.05, { ...idle, forward: true })
      const snap = match.snapshot()
      expect(snap.projectiles.filter((shot) => shot.owner === 'enemy').length).toBeGreaterThanOrEqual(2)
    })

    it('does not block the player front gun with an enemy front ball', () => {
      const match = createMatch({
        ship: { x: 450, y: 600, rotation: 0 },
        chaser: far,
        shooters: [{ x: 200, y: 600 }],
      })
      const snap = match.update(0.016, { ...idle, fire: true })
      expect(snap.projectiles.filter((shot) => shot.owner === 'enemy')).toHaveLength(1)
      expect(snap.projectiles.filter((shot) => shot.owner === 'player' && shot.weapon === 'front')).toHaveLength(1)
    })

    it('does not finish a 1.2 second cooldown in a single capped update', () => {
      const match = createMatch({
        ship: { x: 650, y: 100, rotation: 0 },
        chaser: far,
        shooters: [{ x: 400, y: 100 }],
      })
      match.update(0.016, idle)
      const snap = match.update(GAME_CONFIG.shooterCooldownSeconds, idle)
      expect(snap.projectiles.filter((shot) => shot.owner === 'enemy')).toHaveLength(1)
    })
  })

  describe('spawn during match', () => {
    it('does not birth a ship before the spawn interval', () => {
      const snap = createMatch().update(9, idle)
      expect(snap.enemies).toHaveLength(1)
    })

    it('births a shooter at the first free point after one interval', () => {
      const snap = createMatch().update(10, idle)
      expect(snap.enemies).toHaveLength(2)
      expect(snap.enemies[0].kind).toBe('chaser')
      expect(snap.enemies[0].alive).toBe(true)
      expect(snap.enemies[1].kind).toBe('shooter')
      expect(snap.enemies[1].x).toBe(928)
      expect(snap.enemies[1].y).toBe(384)
    })

    it('births a chaser at the next free point after a second interval', () => {
      const match = createMatch()
      match.update(10, idle)
      const snap = match.update(10, idle)
      expect(snap.enemies).toHaveLength(3)
      expect(snap.enemies[2].kind).toBe('chaser')
      expect(snap.enemies[2].x).toBe(928)
      expect(snap.enemies[2].y).toBe(672)
    })

    it('does not spawn when the match ends by time', () => {
      const snap = createMatch().update(60, idle)
      expect(snap.phase).toBe('result')
      expect(snap.endReason).toBe('time')
      expect(snap.enemies).toHaveLength(1)
    })

    it('carries leftover spawn clock into the next update', () => {
      const match = createMatch()
      const after25 = match.update(25, idle)
      expect(after25.enemies).toHaveLength(3)
      const after5 = match.update(5, idle)
      expect(after5.enemies).toHaveLength(4)
    })

    it('clamps a spawn interval below 5 up to 5', () => {
      const snap = createMatch({ spawnIntervalSeconds: 4 }).update(5, idle)
      expect(snap.enemies).toHaveLength(2)
    })

    it('clamps a spawn interval above 30 down to 30', () => {
      const early = createMatch({ spawnIntervalSeconds: 40 }).update(29, idle)
      expect(early.enemies).toHaveLength(1)
      const snap = createMatch({ spawnIntervalSeconds: 40 }).update(30, idle)
      expect(snap.enemies).toHaveLength(2)
    })

    it('births a shooter after a saved interval of 15 seconds', () => {
      const early = createMatch({ spawnIntervalSeconds: 15 }).update(14, idle)
      expect(early.enemies).toHaveLength(1)
      const snap = createMatch({ spawnIntervalSeconds: 15 }).update(15, idle)
      expect(snap.enemies).toHaveLength(2)
      expect(snap.enemies[1].kind).toBe('shooter')
      expect(snap.enemies[1].x).toBe(928)
      expect(snap.enemies[1].y).toBe(384)
    })
  })
})
