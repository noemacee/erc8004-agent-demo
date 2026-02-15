import { useState, useCallback } from 'react'
import { IdentityRegistryContract } from '../contracts'
import { encodeBytes32String } from 'ethers'

interface DeployAgentFormData {
  agentURI: string
  name: string
  description: string
}

interface MessageState {
  type: 'success' | 'error'
  text: string
}

export function useDeployAgent(contract: IdentityRegistryContract | null) {
  const [deploying, setDeploying] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)

  const clearMessage = useCallback(() => {
    setMessage(null)
  }, [])

  const deployAgent = useCallback(async (formData: DeployAgentFormData): Promise<bigint | null> => {
    if (!contract) {
      setMessage({ type: 'error', text: 'Contract not connected' })
      return null
    }

    setDeploying(true)
    setMessage(null)

    try {
      let tx

      if (formData.agentURI || formData.name || formData.description) {
        // Register with URI and metadata
        const metadata: { metadataKey: string; metadataValue: string }[] = []

        if (formData.name) {
          metadata.push({
            metadataKey: 'name',
            metadataValue: encodeBytes32String(formData.name.slice(0, 31))
          })
        }

        if (formData.description) {
          metadata.push({
            metadataKey: 'description',
            metadataValue: encodeBytes32String(formData.description.slice(0, 31))
          })
        }

        tx = await contract['register(string,(string,bytes)[])'](
          formData.agentURI || '',
          metadata
        )
      } else {
        // Register without URI
        tx = await contract['register()']()
      }

      const receipt = await tx.wait()

      // Parse the Registered event to get the agent ID
      const registeredEvent = receipt?.logs?.find((log: any) => {
        try {
          return log.topics?.[0] === '0x6e4e47ae28a0f39b4436aafd33e1ec5c15e22b227dbd3a9b28f3c17d9ee7e2d4'
        } catch {
          return false
        }
      })

      let agentId: bigint | null = null
      if (registeredEvent && registeredEvent.topics?.[1]) {
        agentId = BigInt(registeredEvent.topics[1])
      }

      setMessage({
        type: 'success',
        text: agentId
          ? `Agent deployed successfully! Agent ID: ${agentId}`
          : 'Agent deployed successfully!'
      })

      return agentId
    } catch (error: any) {
      console.error('Deploy error:', error)
      setMessage({
        type: 'error',
        text: error.reason || error.message || 'Failed to deploy agent'
      })
      return null
    } finally {
      setDeploying(false)
    }
  }, [contract])

  return {
    deploying,
    message,
    deployAgent,
    clearMessage
  }
}
