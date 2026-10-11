import type { SelectFieldProps } from './types'

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
