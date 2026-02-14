import React from 'react'
import { Feedback } from '../../types/contracts'
import { FeedbackItem } from './FeedbackItem'

interface FeedbackListProps {
  items: Feedback[]
}

export function FeedbackList({ items }: FeedbackListProps) {
  return (
    <div className="feedback-list">
      {items.map((item, index) => (
        <FeedbackItem key={`${item.client}-${item.feedbackIndex}`} feedback={item} />
      ))}
    </div>
  )
}
