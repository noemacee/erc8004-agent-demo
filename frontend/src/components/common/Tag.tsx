import React from 'react'

interface TagProps {
  children: React.ReactNode
}

export function Tag({ children }: TagProps) {
  return <span className="tag">{children}</span>
}
