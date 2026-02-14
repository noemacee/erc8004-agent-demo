import React, { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  children?: ReactNode
}

export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
