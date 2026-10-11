import type { ButtonHTMLAttributes } from 'react'

export type GoldButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  compact?: boolean
}
