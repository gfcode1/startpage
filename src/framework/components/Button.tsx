import { ComponentPropsWithoutRef, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: string
  size?: string
  children?: ReactNode
}

export function GfButton({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`gf-btn gf-btn--${variant} gf-btn--${size} ${className}`} {...props}>
      {children}
    </button>
  )
}
