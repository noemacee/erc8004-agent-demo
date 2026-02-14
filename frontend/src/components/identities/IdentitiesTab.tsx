import React, { useEffect } from 'react'
import { Card, SectionHeader, Button, Loading, EmptyState } from '../common'
import { AgentGrid } from './AgentGrid'
import { useWeb3 } from '../../context/Web3Context'
import { useIdentities } from '../../hooks/useIdentities'

export function IdentitiesTab() {
  const { contracts, isConnected } = useWeb3()
  const { agents, loading, error, loadIdentities } = useIdentities(contracts.identity)

  useEffect(() => {
    if (isConnected && contracts.identity) {
      loadIdentities()
    }
  }, [isConnected, contracts.identity, loadIdentities])

  return (
    <Card>
      <SectionHeader title="Registered Agents">
        <Button variant="refresh" onClick={loadIdentities}>
          Refresh
        </Button>
      </SectionHeader>

      {loading && <Loading text="Loading agents" />}

      {!loading && error && <EmptyState message={error} />}

      {!loading && !error && agents.length === 0 && (
        <EmptyState message="Connect wallet and enter contract addresses to view registered agents" />
      )}

      {!loading && !error && agents.length > 0 && <AgentGrid agents={agents} />}
    </Card>
  )
}
