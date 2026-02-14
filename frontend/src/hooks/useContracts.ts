import { useMemo } from 'react'
import { JsonRpcSigner, isAddress } from 'ethers'
import { ContractAddresses } from '../types/contracts'
import {
  IdentityRegistryContract,
  ReputationRegistryContract,
  ValidationRegistryContract,
  createIdentityRegistry,
  createReputationRegistry,
  createValidationRegistry
} from '../contracts'

interface Contracts {
  identity: IdentityRegistryContract | null
  reputation: ReputationRegistryContract | null
  validation: ValidationRegistryContract | null
}

/**
 * Check if a contract exists at the given address
 */
export async function contractExists(address: string, provider: JsonRpcSigner['provider']): Promise<boolean> {
  if (!provider || !isAddress(address)) return false
  try {
    const code = await provider.getCode(address)
    return code !== '0x' && code.length > 2
  } catch {
    return false
  }
}

export function useContracts(addresses: ContractAddresses, signer: JsonRpcSigner | null): Contracts {
  return useMemo(() => {
    if (!signer) {
      return { identity: null, reputation: null, validation: null }
    }

    return {
      identity: addresses.identity && isAddress(addresses.identity)
        ? createIdentityRegistry(addresses.identity, signer)
        : null,
      reputation: addresses.reputation && isAddress(addresses.reputation)
        ? createReputationRegistry(addresses.reputation, signer)
        : null,
      validation: addresses.validation && isAddress(addresses.validation)
        ? createValidationRegistry(addresses.validation, signer)
        : null
    }
  }, [addresses, signer])
}
