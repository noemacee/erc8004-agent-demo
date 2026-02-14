import React, { useState } from 'react'
import { Input, SubmitButton, Message } from '../common'
import { FeedbackFormData } from '../../types/contracts'
import { useGiveFeedback } from '../../hooks/useFeedback'
import { ReputationRegistryContract } from '../../contracts'

interface FeedbackFormProps {
  contract: ReputationRegistryContract | null
}

const initialFormData: FeedbackFormData = {
  agentId: 0,
  value: 0,
  decimals: 0,
  tag1: '',
  tag2: '',
  endpoint: '',
  feedbackURI: ''
}

export function FeedbackForm({ contract }: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData)
  const { submitting, message, submitFeedback, clearMessage } = useGiveFeedback(contract)

  const handleChange = (field: keyof FeedbackFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    clearMessage()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await submitFeedback(formData)
    if (success) {
      setFormData(initialFormData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && <Message type={message.type} text={message.text} />}

      <Input
        label="Agent ID"
        type="number"
        required
        min={1}
        placeholder="Enter agent ID"
        value={formData.agentId || ''}
        onChange={handleChange('agentId')}
      />

      <div className="form-row">
        <Input
          label="Value (-100 to 100)"
          type="number"
          required
          min={-100}
          max={100}
          placeholder="e.g., 85"
          value={formData.value || ''}
          onChange={handleChange('value')}
        />
        <Input
          label="Value Decimals (0-18)"
          type="number"
          min={0}
          max={18}
          value={formData.decimals}
          onChange={handleChange('decimals')}
        />
      </div>

      <div className="form-row">
        <Input
          label="Tag 1 (optional)"
          type="text"
          placeholder="e.g., quality"
          value={formData.tag1}
          onChange={handleChange('tag1')}
        />
        <Input
          label="Tag 2 (optional)"
          type="text"
          placeholder="e.g., fast"
          value={formData.tag2}
          onChange={handleChange('tag2')}
        />
      </div>

      <Input
        label="Endpoint (optional)"
        type="text"
        placeholder="e.g., /api/generate"
        value={formData.endpoint}
        onChange={handleChange('endpoint')}
      />

      <Input
        label="Feedback URI (optional)"
        type="text"
        placeholder="ipfs://... or https://..."
        value={formData.feedbackURI}
        onChange={handleChange('feedbackURI')}
      />

      <SubmitButton type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </SubmitButton>
    </form>
  )
}
