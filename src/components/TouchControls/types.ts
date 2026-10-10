import type { HeldControls } from '../../types/game'

export type TouchControlsProps = {
  onHold: (action: keyof HeldControls, held: boolean) => void
}
