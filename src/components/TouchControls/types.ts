import type { Stick } from '../../game/touch'

export type TouchControlsProps = {
  onStick: (stick: Stick | null) => void
  onFire: (held: boolean) => void
}
