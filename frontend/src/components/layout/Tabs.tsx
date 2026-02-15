import React from 'react'

export type TabId = 'identities' | 'deploy-agent' | 'feedback' | 'give-feedback'

interface TabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'identities', label: 'Agents' },
  { id: 'deploy-agent', label: 'Deploy' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'give-feedback', label: 'Give Feedback' }
]

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="tabs">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
