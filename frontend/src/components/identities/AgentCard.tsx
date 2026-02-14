import React from 'react'
import { Agent } from '../../types/contracts'

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function truncateUri(uri: string, maxLength = 30): string {
  return uri.length > maxLength ? `${uri.slice(0, maxLength)}...` : uri
}

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="agent-card">
      <div className="agent-id">Agent #{agent.id}</div>
      <div className="agent-info">
        Owner: <span>{formatAddress(agent.owner)}</span>
      </div>
      {agent.wallet && (
        <div className="agent-info">
          Wallet: <span>{formatAddress(agent.wallet)}</span>
        </div>
      )}
      {agent.uri && (
        <div className="agent-info">
          URI: <span>{truncateUri(agent.uri)}</span>
        </div>
      )}
    </div>
  )
}
