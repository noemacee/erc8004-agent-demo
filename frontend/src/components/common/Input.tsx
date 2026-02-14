import React, { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input className={className} {...props} />
    </div>
  )
}

interface ConfigInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function ConfigInput({ label, className = '', ...props }: ConfigInputProps) {
  return (
    <div className="config-item">
      <label>{label}</label>
      <input className={className} {...props} />
    </div>
  )
}
