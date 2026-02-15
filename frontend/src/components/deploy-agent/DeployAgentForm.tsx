import React, { useState } from 'react'
import { Input, SubmitButton, Message } from '../common'
import { useDeployAgent } from '../../hooks/useDeployAgent'
import { IdentityRegistryContract } from '../../contracts'

interface DeployAgentFormProps {
  contract: IdentityRegistryContract | null
  onSuccess?: () => void
}

interface FormData {
  agentURI: string
  name: string
  description: string
}

const initialFormData: FormData = {
  agentURI: '',
  name: '',
  description: ''
}

export function DeployAgentForm({ contract, onSuccess }: DeployAgentFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const { deploying, message, deployAgent, clearMessage } = useDeployAgent(contract)

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    clearMessage()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const agentId = await deployAgent(formData)
    if (agentId !== null) {
      setFormData(initialFormData)
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && <Message type={message.type} text={message.text} />}

      <Input
        label="Agent Name (optional)"
        type="text"
        placeholder="My AI Agent"
        value={formData.name}
        onChange={handleChange('name')}
      />

      <Input
        label="Description (optional)"
        type="text"
        placeholder="A helpful AI assistant"
        value={formData.description}
        onChange={handleChange('description')}
      />

      <Input
        label="Agent URI (optional)"
        type="text"
        placeholder="ipfs://... or https://..."
        value={formData.agentURI}
        onChange={handleChange('agentURI')}
      />

      <SubmitButton type="submit" disabled={deploying || !contract}>
        {deploying ? 'Deploying...' : 'Deploy Agent'}
      </SubmitButton>
    </form>
  )
}
