import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, JsonRpcSigner } from 'ethers'

interface WalletState {
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  address: string | null
  networkName: string | null
  chainId: bigint | null
  isConnecting: boolean
  error: string | null
}

// Base Sepolia network configuration
const BASE_SEPOLIA = {
  chainId: '0x14a34', // 84532 in hex
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org']
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: null,
    signer: null,
    address: null,
    networkName: null,
    chainId: null,
    isConnecting: false,
    error: null
  })

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'Please install MetaMask or another Web3 wallet' }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const provider = new BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      setState({
        provider,
        signer,
        address,
        networkName: network.name,
        chainId: network.chainId,
        isConnecting: false,
        error: null
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      address: null,
      networkName: null,
      chainId: null,
      isConnecting: false,
      error: null
    })
  }, [])

  const switchToBaseSepolia = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'Please install MetaMask or another Web3 wallet' }))
      return false
    }

    try {
      // Try to switch to Base Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA.chainId }]
      })
      return true
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Base Sepolia to MetaMask
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA]
          })
          return true
        } catch (addError) {
          setState(prev => ({
            ...prev,
            error: 'Failed to add Base Sepolia network to MetaMask'
          }))
          return false
        }
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to switch to Base Sepolia network'
        }))
        return false
      }
    }
  }, [])

  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = () => {
      window.location.reload()
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    switchToBaseSepolia,
    isConnected: !!state.address
  }
}
