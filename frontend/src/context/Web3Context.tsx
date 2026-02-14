import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { ContractAddresses } from '../types/contracts'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import {
  IdentityRegistryContract,
  ReputationRegistryContract,
  ValidationRegistryContract
} from '../contracts'

interface Web3ContextType {
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  address: string | null
  networkName: string | null
  chainId: bigint | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  switchToBaseSepolia: () => Promise<boolean>
  addresses: ContractAddresses
  setAddresses: (addresses: ContractAddresses) => void
  contracts: {
    identity: IdentityRegistryContract | null
    reputation: ReputationRegistryContract | null
    validation: ValidationRegistryContract | null
  }
  expectedChainId: bigint | null
  isCorrectNetwork: boolean
}

const Web3Context = createContext<Web3ContextType | null>(null)

const DEFAULT_ADDRESSES: ContractAddresses = {
  identity: '',
  reputation: '',
  validation: ''
}

interface DeploymentInfo {
  network: string
  chainId: string
  contracts: {
    identityRegistry: string
    reputationRegistry: string
    validationRegistry: string
  }
}

async function loadConfigAddresses(): Promise<ContractAddresses> {
  try {
    const response = await fetch('/deployment-info.json')
    if (!response.ok) {
      console.warn('Could not load deployment-info.json, using empty addresses')
      return DEFAULT_ADDRESSES
    }
    const data = await response.json()
    if (data.contracts) {
      return {
        identity: data.contracts.identityRegistry || '',
        reputation: data.contracts.reputationRegistry || '',
        validation: data.contracts.validationRegistry || ''
      }
    }
    return DEFAULT_ADDRESSES
  } catch (error) {
    console.warn('Error loading deployment-info.json:', error)
    return DEFAULT_ADDRESSES
  }
}

async function loadDeploymentInfo(): Promise<DeploymentInfo | null> {
  try {
    const response = await fetch('/deployment-info.json')
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.warn('Error loading deployment-info.json:', error)
    return null
  }
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const wallet = useWallet()
  const [addresses, setAddresses] = useState<ContractAddresses>(DEFAULT_ADDRESSES)
  const [expectedChainId, setExpectedChainId] = useState<bigint | null>(null)
  const contracts = useContracts(addresses, wallet.signer)

  useEffect(() => {
    // Load addresses from config file on mount
    loadConfigAddresses().then(setAddresses)
    // Load expected chain ID
    loadDeploymentInfo().then(info => {
      if (info) {
        setExpectedChainId(BigInt(info.chainId))
      }
    })
  }, [])

  // Validate network when wallet is connected
  useEffect(() => {
    if (!wallet.provider || !wallet.isConnected) return

    const validateNetwork = async () => {
      try {
        const deploymentInfo = await loadDeploymentInfo()
        if (!deploymentInfo) return

        const network = await wallet.provider!.getNetwork()
        const expectedChainId = BigInt(deploymentInfo.chainId)

        if (network.chainId !== expectedChainId) {
          console.warn(
            `Network mismatch: Connected to chain ${network.chainId}, but contracts are deployed on chain ${deploymentInfo.chainId} (${deploymentInfo.network})`
          )
        }
      } catch (error) {
        console.warn('Error validating network:', error)
      }
    }

    validateNetwork()
  }, [wallet.provider, wallet.isConnected])

  const isCorrectNetwork = expectedChainId !== null && wallet.chainId !== null && wallet.chainId === expectedChainId

  const value: Web3ContextType = {
    provider: wallet.provider,
    signer: wallet.signer,
    address: wallet.address,
    networkName: wallet.networkName,
    chainId: wallet.chainId,
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    error: wallet.error,
    connect: wallet.connect,
    switchToBaseSepolia: wallet.switchToBaseSepolia,
    addresses,
    setAddresses,
    contracts,
    expectedChainId,
    isCorrectNetwork
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}
