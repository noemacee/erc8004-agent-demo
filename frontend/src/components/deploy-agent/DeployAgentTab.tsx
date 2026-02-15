import React from 'react'
import { Card } from '../common'
import { DeployAgentForm } from './DeployAgentForm'
import { useWeb3 } from '../../context/Web3Context'

interface DeployAgentTabProps {
  onAgentDeployed?: () => void
}

export function DeployAgentTab({ onAgentDeployed }: DeployAgentTabProps) {
  const { contracts, isConnected } = useWeb3()

  return (
    <Card>
      <h2>Deploy Agent</h2>
      {!isConnected ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '24px' }}>
          Connect your wallet to deploy an agent
        </p>
      ) : (
        <DeployAgentForm
          contract={contracts.identity}
          onSuccess={onAgentDeployed}
        />
      )}
    </Card>
  )
}
