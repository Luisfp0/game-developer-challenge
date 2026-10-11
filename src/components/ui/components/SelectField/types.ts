import type { SelectHTMLAttributes } from 'react'

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
}
