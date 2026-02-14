import React, { useState, useEffect, useCallback } from 'react'
import { Card, SectionHeader, Button, Loading, EmptyState } from '../common'
import { AgentSelector } from './AgentSelector'
import { FeedbackList } from './FeedbackList'
import { useWeb3 } from '../../context/Web3Context'
import { useIdentities } from '../../hooks/useIdentities'
import { useFeedback } from '../../hooks/useFeedback'

export function FeedbackTab() {
  const { contracts, isConnected } = useWeb3()
  const { agents, loadIdentities } = useIdentities(contracts.identity)
  const { feedback, loading, error, loadFeedback } = useFeedback(contracts.reputation)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)

  useEffect(() => {
    if (isConnected && contracts.identity) {
      loadIdentities()
    }
  }, [isConnected, contracts.identity, loadIdentities])

  const handleSelectAgent = useCallback((agentId: number) => {
    setSelectedAgentId(agentId)
    loadFeedback(agentId)
  }, [loadFeedback])

  const handleRefresh = useCallback(() => {
    if (selectedAgentId) {
      loadFeedback(selectedAgentId)
    }
  }, [selectedAgentId, loadFeedback])

  return (
    <Card>
      <SectionHeader title="View Agent Feedback">
        <Button variant="refresh" onClick={handleRefresh}>
          Refresh
        </Button>
      </SectionHeader>

      <p style={{ color: '#888', marginBottom: '15px' }}>
        Select an agent to view their feedback:
      </p>

      <AgentSelector
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelect={handleSelectAgent}
      />

      {loading && <Loading text="Loading feedback" />}

      {!loading && error && <EmptyState message={error} />}

      {!loading && !error && !selectedAgentId && (
        <EmptyState message="Select an agent above to view their feedback" />
      )}

      {!loading && !error && selectedAgentId && feedback.length > 0 && (
        <FeedbackList items={feedback} />
      )}
    </Card>
  )
}
