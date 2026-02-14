import React from 'react'
import { Agent } from '../../types/contracts'

interface AgentSelectorProps {
  agents: Agent[]
  selectedAgentId: number | null
  onSelect: (agentId: number) => void
}

export function AgentSelector({ agents, selectedAgentId, onSelect }: AgentSelectorProps) {
  if (agents.length === 0) {
    return <div style={{ color: '#666' }}>No agents registered</div>
  }

  return (
    <div className="agent-select-grid">
      {agents.map(agent => (
        <button
          key={agent.id}
          type="button"
          className={`agent-select-btn ${selectedAgentId === agent.id ? 'selected' : ''}`}
          onClick={() => onSelect(agent.id)}
        >
          Agent #{agent.id}
        </button>
      ))}
    </div>
  )
}
