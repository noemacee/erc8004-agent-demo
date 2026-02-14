import React from 'react'

interface StatusDotProps {
  connected: boolean
}

export function StatusDot({ connected }: StatusDotProps) {
  return <div className={`status-dot ${connected ? 'connected' : ''}`} />
}
