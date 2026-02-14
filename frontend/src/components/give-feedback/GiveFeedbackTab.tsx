import React from 'react'
import { Card } from '../common'
import { FeedbackForm } from './FeedbackForm'
import { useWeb3 } from '../../context/Web3Context'

export function GiveFeedbackTab() {
  const { contracts } = useWeb3()

  return (
    <Card>
      <h2>Submit Feedback</h2>
      <FeedbackForm contract={contracts.reputation} />
    </Card>
  )
}
