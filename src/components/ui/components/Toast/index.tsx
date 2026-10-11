import type { ToastProps } from './types'

export const Toast = ({ message }: ToastProps) => {
  if (!message) return null
  return (
    <p className="toast" role="status">
      {message}
    </p>
  )
}
