export interface Agent {
  id: number
  owner: string
  uri: string
  wallet: string
}

export interface Feedback {
  client: string
  feedbackIndex: bigint
  value: bigint
  valueDecimals: number
  tag1: string
  tag2: string
  isRevoked: boolean
}

export interface ContractAddresses {
  identity: string
  reputation: string
  validation: string
}

export interface FeedbackFormData {
  agentId: number
  value: number
  decimals: number
  tag1: string
  tag2: string
  endpoint: string
  feedbackURI: string
}
