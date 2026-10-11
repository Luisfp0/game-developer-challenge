import type { HeldControls } from '../../../../types/game'

export const controlsFromKeys = (keys: Set<string>): HeldControls => {
  return {
    forward: keys.has('KeyW') || keys.has('ArrowUp'),
    left: keys.has('KeyA') || keys.has('ArrowLeft'),
    right: keys.has('KeyD') || keys.has('ArrowRight'),
    fire: keys.has('Space'),
    fireLeft: keys.has('KeyQ'),
    fireRight: keys.has('KeyE'),
  }
}
