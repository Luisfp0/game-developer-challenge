export const ASSET_URLS = {
  water: new URL('../../assets/png/default/tiles/tile_73.png', import.meta.url).href,
  land: new URL('../../assets/png/default/tiles/tile_23.png', import.meta.url).href,
  playerShip: new URL('../../assets/png/default/ships/ship_1.png', import.meta.url).href,
  chaserShip: new URL('../../assets/png/default/ships/ship_5.png', import.meta.url).href,
  shooterShip: new URL('../../assets/png/default/ships/ship_8.png', import.meta.url).href,
  cannonball: new URL('../../assets/png/default/ship_parts/cannon_ball.png', import.meta.url).href,
  playerHealthFrame: new URL('../../assets/png/default/ui/hud/health_frame.png', import.meta.url).href,
  playerHealthFill: new URL('../../assets/png/default/ui/hud/health_fill_green.png', import.meta.url).href,
  enemyHealthFrame: new URL('../../assets/png/default/ui/hud/enemy_health_frame.png', import.meta.url).href,
  enemyHealthFill: new URL('../../assets/png/default/ui/hud/enemy_health_fill_green.png', import.meta.url).href,
} as const
