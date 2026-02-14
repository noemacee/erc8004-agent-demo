import React, { ReactNode } from 'react'

interface MessageProps {
  type?: 'success' | 'error'
  variant?: 'success' | 'error' | 'warning'
  text?: string
  children?: ReactNode
  style?: React.CSSProperties
}

export function Message({ type, variant, text, children, style }: MessageProps) {
  // Support both 'type' and 'variant' for backward compatibility
  const messageType = variant || type || 'success'
  const content = children || text || ''
  
  return <div className={`message ${messageType}`} style={style}>{content}</div>
}
