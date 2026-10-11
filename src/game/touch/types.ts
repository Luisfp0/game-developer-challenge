export type Stick = { x: number; y: number }

export type TouchInput = {
  stick: Stick | null
  fire: boolean
  fireLeft: boolean
  fireRight: boolean
}
