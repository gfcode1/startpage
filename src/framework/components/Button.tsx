import { ComponentPropsWithoutRef, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'toolbar' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  children?: ReactNode
}

export function GfButton({ variant = 'primary', size = 'md', active, children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`gf-btn gf-btn--${variant} gf-btn--${size}${active ? ' gf-btn--active' : ''} ${className}`} {...props}>
      {children}
    </button>
  )
}
