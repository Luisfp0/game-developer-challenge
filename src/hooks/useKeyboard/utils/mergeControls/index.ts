import type { HeldControls } from '../../../../types/game'

export const mergeControls = (keyboard: HeldControls, touch: HeldControls): HeldControls => {
  return {
    forward: keyboard.forward || touch.forward,
    left: keyboard.left || touch.left,
    right: keyboard.right || touch.right,
    fire: keyboard.fire || touch.fire,
    fireLeft: keyboard.fireLeft || touch.fireLeft,
    fireRight: keyboard.fireRight || touch.fireRight,
  }
}
