import React from 'react'
import { Feedback } from '../../types/contracts'
import { Tag } from '../common'

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface FeedbackItemProps {
  feedback: Feedback
}

export function FeedbackItem({ feedback }: FeedbackItemProps) {
  const value = Number(feedback.value)
  const valueClass = value >= 0 ? 'positive' : 'negative'

  return (
    <div
      className={`feedback-item ${valueClass}`}
      style={feedback.isRevoked ? { opacity: 0.5 } : undefined}
    >
      <div className="feedback-header">
        <div className={`feedback-value ${valueClass}`}>
          {value >= 0 ? '+' : ''}{value}
          {feedback.isRevoked && (
            <span style={{ color: '#ff4444', fontSize: '0.8rem' }}> (REVOKED)</span>
          )}
        </div>
        <div className="feedback-client">{formatAddress(feedback.client)}</div>
      </div>
      <div className="feedback-tags">
        {feedback.tag1 && <Tag>{feedback.tag1}</Tag>}
        {feedback.tag2 && <Tag>{feedback.tag2}</Tag>}
        <Tag>Index: {feedback.feedbackIndex.toString()}</Tag>
      </div>
    </div>
  )
}
