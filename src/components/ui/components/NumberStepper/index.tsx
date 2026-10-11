import { UI_ASSETS } from '../../assets'
import { stepWhole } from '../../utils/step'
import type { NumberStepperProps } from './types'

export const NumberStepper = ({ id, label, value, min, max, step, error, onChange }: NumberStepperProps) => {
  const current = /^\d+$/.test(value.trim()) ? Number(value.trim()) : null
  return (
    <div className="field">
      <span className="stepper-label" id={`${id}-label`}>{label}</span>
      <div className="stepper">
        <button
          type="button"
          className="round-button"
          aria-label={`Decrease ${label}`}
          disabled={current !== null && current <= min}
          onClick={() => onChange(stepWhole(value, -1, min, max, step))}
        >
          <img src={UI_ASSETS.iconMinus} alt="" />
        </button>
        <input
          id={id}
          inputMode="numeric"
          aria-labelledby={`${id}-label`}
          aria-invalid={error !== null}
          aria-describedby={error ? `${id}-error` : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="round-button"
          aria-label={`Increase ${label}`}
          disabled={current !== null && current >= max}
          onClick={() => onChange(stepWhole(value, 1, min, max, step))}
        >
          <img src={UI_ASSETS.iconPlus} alt="" />
        </button>
      </div>
      {error ? (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
