import { useState, useCallback } from 'react'
import { Feedback, FeedbackFormData } from '../types/contracts'
import { ReputationRegistryContract } from '../contracts'

interface UseFeedbackReturn {
  feedback: Feedback[]
  loading: boolean
  error: string | null
  loadFeedback: (agentId: number) => Promise<void>
}

export function useFeedback(contract: ReputationRegistryContract | null): UseFeedbackReturn {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFeedback = useCallback(async (agentId: number) => {
    if (!contract) {
      setError('Enter Reputation Registry address and connect wallet')
      return
    }

    setLoading(true)
    setError(null)
    setFeedback([])

    try {
      const result = await contract.readAllFeedback(
        agentId,
        [], // all clients
        '', // no tag1 filter
        '', // no tag2 filter
        true // include revoked
      )

      const [clients, indexes, values, decimals, tag1s, tag2s, revokedStatuses] = result

      if (clients.length === 0) {
        setError(`No feedback for Agent #${agentId}`)
        setLoading(false)
        return
      }

      const feedbackItems: Feedback[] = clients.map((client, i) => ({
        client,
        feedbackIndex: indexes[i],
        value: values[i],
        valueDecimals: decimals[i],
        tag1: tag1s[i],
        tag2: tag2s[i],
        isRevoked: revokedStatuses[i]
      }))

      setFeedback(feedbackItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading feedback')
    } finally {
      setLoading(false)
    }
  }, [contract])

  return { feedback, loading, error, loadFeedback }
}

interface UseGiveFeedbackReturn {
  submitting: boolean
  message: { type: 'success' | 'error'; text: string } | null
  submitFeedback: (data: FeedbackFormData) => Promise<boolean>
  clearMessage: () => void
}

export function useGiveFeedback(contract: ReputationRegistryContract | null): UseGiveFeedbackReturn {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const clearMessage = useCallback(() => setMessage(null), [])

  const submitFeedback = useCallback(async (data: FeedbackFormData): Promise<boolean> => {
    if (!contract) {
      setMessage({ type: 'error', text: 'Please enter Reputation Registry address and connect wallet' })
      return false
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const feedbackHash = '0x0000000000000000000000000000000000000000000000000000000000000000'

      const tx = await contract.giveFeedback(
        data.agentId,
        data.value,
        data.decimals,
        data.tag1,
        data.tag2,
        data.endpoint,
        data.feedbackURI,
        feedbackHash
      )

      setMessage({ type: 'success', text: 'Transaction submitted! Waiting for confirmation...' })

      await tx.wait()

      setMessage({ type: 'success', text: 'Feedback submitted successfully!' })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error
        ? (err as { reason?: string }).reason || err.message
        : 'Error submitting feedback'
      setMessage({ type: 'error', text: `Error: ${errorMessage}` })
      return false
    } finally {
      setSubmitting(false)
    }
  }, [contract])

  return { submitting, message, submitFeedback, clearMessage }
}
