import { forwardRef } from 'react'
import type { GoldButtonProps } from './types'

export const GoldButton = forwardRef<HTMLButtonElement, GoldButtonProps>((
  { variant = 'primary', compact = false, className = '', ...props },
  ref,
) => {
  const classes = ['gold-button', variant === 'secondary' ? 'secondary' : '', compact ? 'compact' : '', className]
    .filter(Boolean)
    .join(' ')
  return <button ref={ref} className={classes} {...props} />
})
