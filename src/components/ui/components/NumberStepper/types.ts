export type NumberStepperProps = {
  id: string
  label: string
  value: string
  min: number
  max: number
  step: number
  error: string | null
  onChange: (value: string) => void
}
