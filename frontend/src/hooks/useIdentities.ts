import { useState, useCallback } from 'react'
import { Agent } from '../types/contracts'
import { IdentityRegistryContract } from '../contracts'
import { Contract, JsonRpcProvider } from 'ethers'

interface UseIdentitiesReturn {
  agents: Agent[]
  loading: boolean
  error: string | null
  loadIdentities: () => Promise<void>
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function useIdentities(contract: IdentityRegistryContract | null): UseIdentitiesReturn {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIdentities = useCallback(async () => {
    if (!contract) {
      setError('Enter Identity Registry address and connect wallet')
      return
    }

    setLoading(true)
    setError(null)
    setAgents([])

    try {
      // Try to call getNextAgentId - if it fails, the contract might not exist at this address
      let nextId: bigint
      try {
        nextId = await contract.getNextAgentId()
      } catch (err: any) {
        // Check if it's a BAD_DATA error (contract doesn't exist or wrong network)
        if (err?.code === 'BAD_DATA' || err?.message?.includes('could not decode') || err?.message?.includes('0x')) {
          // Try to get more info about the error
          const contractInstance = contract as unknown as Contract
          const address = contractInstance.target
          const runner = contractInstance.runner

          let errorMsg = 'Contract not found at this address. '
          if (runner && 'provider' in runner && runner.provider) {
            try {
              const code = await (runner.provider as JsonRpcProvider).getCode(address as string)
              if (code === '0x' || code.length <= 2) {
                errorMsg += 'No contract code found at this address. '
              }
            } catch {
              // Ignore
            }
          }
          errorMsg += 'Please check the address and ensure you are connected to the correct network (Base Sepolia - Chain ID: 84532).'
          setError(errorMsg)
          setLoading(false)
          return
        }
        throw err
      }

      const totalAgents = Number(nextId) - 1

      if (totalAgents === 0) {
        setError('No agents registered yet')
        setLoading(false)
        return
      }

      const loadedAgents: Agent[] = []

      for (let i = 1; i <= totalAgents; i++) {
        try {
          const owner = await contract.ownerOf(i)
          let uri = ''
          let wallet = ''

          try {
            uri = await contract.tokenURI(i)
          } catch {
            // URI not set
          }

          try {
            wallet = await contract.getAgentWallet(i)
            if (wallet === ZERO_ADDRESS) wallet = ''
          } catch {
            // Wallet not set
          }

          loadedAgents.push({ id: i, owner, uri, wallet })
        } catch {
          // Token might have been burned
        }
      }

      if (loadedAgents.length === 0) {
        setError('No agents registered yet')
      } else {
        setAgents(loadedAgents)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading agents'
      // Provide more helpful error messages
      if (errorMessage.includes('BAD_DATA') || errorMessage.includes('could not decode')) {
        setError('Contract not found at this address. Please check the address and ensure you are connected to the correct network (Base Sepolia - Chain ID: 84532).')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [contract])

  return { agents, loading, error, loadIdentities }
}
