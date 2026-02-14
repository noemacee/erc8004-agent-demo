import React from 'react'
import { Agent } from '../../types/contracts'
import { AgentCard } from './AgentCard'

interface AgentGridProps {
  agents: Agent[]
}

export function AgentGrid({ agents }: AgentGridProps) {
  return (
    <div className="agent-grid">
      {agents.map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
