import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { UI_ASSETS } from './assets'
import { stepWhole } from './step'

type GoldButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  compact?: boolean
}

export const GoldButton = forwardRef<HTMLButtonElement, GoldButtonProps>((
  { variant = 'primary', compact = false, className = '', ...props },
  ref,
) => {
  const classes = ['gold-button', variant === 'secondary' ? 'secondary' : '', compact ? 'compact' : '', className]
    .filter(Boolean)
    .join(' ')
  return <button ref={ref} className={classes} {...props} />
})

export const Screen = ({ children, wide = false }: { children: ReactNode; wide?: boolean }) => {
  return (
    <div className="screen">
      <div className={wide ? 'panel panel-wide' : 'panel'}>{children}</div>
    </div>
  )
}

export const MenuScreen = ({ panel, below }: { panel: ReactNode; below?: ReactNode }) => {
  return (
    <div className="screen">
      <div className="menu-stack">
        <div className="panel">{panel}</div>
        {below}
      </div>
    </div>
  )
}

type NumberStepperProps = {
  id: string
  label: string
  value: string
  min: number
  max: number
  step: number
  error: string | null
  onChange: (value: string) => void
}

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

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
}

export const SelectField = ({ id, label, children, ...props }: SelectFieldProps) => {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...props}>
        {children}
      </select>
    </div>
  )
}

export const Toast = ({ message }: { message: string | null }) => {
  if (!message) return null
  return (
    <p className="toast" role="status">
      {message}
    </p>
  )
}

export const SAVED_TOAST = 'Saved.'
export const RESTORED_TOAST = 'Records restored.'
export const SAVE_FAILED_TOAST = 'Could not be saved.'
