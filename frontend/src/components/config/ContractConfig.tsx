import React from 'react'
import { ConfigInput, Button, Message } from '../common'
import { useWeb3 } from '../../context/Web3Context'

export function ContractConfig() {
  const { addresses, setAddresses, isConnected, chainId, expectedChainId, isCorrectNetwork, switchToBaseSepolia } = useWeb3()

  const handleChange = (field: 'identity' | 'reputation' | 'validation') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAddresses({ ...addresses, [field]: e.target.value })
  }

  const handleSwitchNetwork = async () => {
    const success = await switchToBaseSepolia()
    if (success) {
      // Reload page to refresh connection
      window.location.reload()
    }
  }

  return (
    <div className="config-section">
      <h3>Contract Addresses</h3>
      <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.9rem' }}>
        Contract addresses are automatically loaded from deployment-info.json
      </p>
      
      {isConnected && !isCorrectNetwork && expectedChainId !== null && (
        <Message variant="warning" style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Wrong network! Connected to chain {chainId?.toString()}, but contracts are on chain {expectedChainId.toString()} (Base Sepolia).
            </span>
            <Button onClick={handleSwitchNetwork} style={{ marginLeft: '10px' }}>
              Switch to Base Sepolia
            </Button>
          </div>
        </Message>
      )}

      {isConnected && isCorrectNetwork && (
        <Message variant="success" style={{ marginBottom: '15px' }}>
          ✓ Connected to the correct network (Base Sepolia)
        </Message>
      )}

      <div className="config-grid">
        <ConfigInput
          label="Identity Registry"
          placeholder="0x..."
          value={addresses.identity}
          onChange={handleChange('identity')}
        />
        <ConfigInput
          label="Reputation Registry"
          placeholder="0x..."
          value={addresses.reputation}
          onChange={handleChange('reputation')}
        />
        <ConfigInput
          label="Validation Registry"
          placeholder="0x..."
          value={addresses.validation}
          onChange={handleChange('validation')}
        />
      </div>
    </div>
  )
}
