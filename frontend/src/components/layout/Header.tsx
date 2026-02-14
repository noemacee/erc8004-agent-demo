import React from 'react'
import { StatusDot, Button } from '../common'
import { useWeb3 } from '../../context/Web3Context'

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Header() {
  const { address, networkName, isConnected, isConnecting, connect } = useWeb3()

  return (
    <header>
      <h1>ERC-8004 Agent Registry</h1>
      <p>Manage agent identities, feedback, and reputation on-chain</p>
      <div className="connection-status">
        <StatusDot connected={isConnected} />
        <span>
          {isConnected
            ? `${formatAddress(address!)} (${networkName})`
            : 'Not Connected'}
        </span>
        <Button
          onClick={connect}
          disabled={isConnected || isConnecting}
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
        </Button>
      </div>
    </header>
  )
}
