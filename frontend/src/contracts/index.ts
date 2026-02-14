import { Contract, Signer, ContractTransactionResponse } from 'ethers'
import { IDENTITY_REGISTRY_ABI } from './abis/IdentityRegistry'
import { REPUTATION_REGISTRY_ABI } from './abis/ReputationRegistry'
import { VALIDATION_REGISTRY_ABI } from './abis/ValidationRegistry'

export interface IdentityRegistryContract {
  getNextAgentId(): Promise<bigint>
  ownerOf(tokenId: bigint | number): Promise<string>
  tokenURI(tokenId: bigint | number): Promise<string>
  getAgentWallet(agentId: bigint | number): Promise<string>
  getMetadata(agentId: bigint | number, metadataKey: string): Promise<string>
}

export interface ReputationRegistryContract {
  giveFeedback(
    agentId: bigint | number,
    value: bigint | number,
    valueDecimals: number,
    tag1: string,
    tag2: string,
    endpoint: string,
    feedbackURI: string,
    feedbackHash: string
  ): Promise<ContractTransactionResponse>
  readFeedback(
    agentId: bigint | number,
    clientAddress: string,
    feedbackIndex: bigint | number
  ): Promise<[bigint, number, string, string, boolean]>
  getClients(agentId: bigint | number): Promise<string[]>
  getLastIndex(agentId: bigint | number, clientAddress: string): Promise<bigint>
  readAllFeedback(
    agentId: bigint | number,
    clientAddresses: string[],
    tag1: string,
    tag2: string,
    includeRevoked: boolean
  ): Promise<[string[], bigint[], bigint[], number[], string[], string[], boolean[]]>
}

export interface ValidationRegistryContract {
  getAgentValidations(agentId: bigint | number): Promise<string[]>
  getValidationStatus(requestHash: string): Promise<[string, bigint, number, string, string, bigint]>
}

export function createIdentityRegistry(address: string, signer: Signer): IdentityRegistryContract {
  return new Contract(address, IDENTITY_REGISTRY_ABI, signer) as unknown as IdentityRegistryContract
}

export function createReputationRegistry(address: string, signer: Signer): ReputationRegistryContract {
  return new Contract(address, REPUTATION_REGISTRY_ABI, signer) as unknown as ReputationRegistryContract
}

export function createValidationRegistry(address: string, signer: Signer): ValidationRegistryContract {
  return new Contract(address, VALIDATION_REGISTRY_ABI, signer) as unknown as ValidationRegistryContract
}

export { IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ABI, VALIDATION_REGISTRY_ABI }
