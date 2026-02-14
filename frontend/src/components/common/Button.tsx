import React, { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'refresh'
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const baseClass = variant === 'primary'
    ? 'connect-btn'
    : variant === 'refresh'
    ? 'refresh-btn'
    : 'tab'

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function SubmitButton({ className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`submit-btn ${className}`} {...props}>
      {children}
    </button>
  )
}
