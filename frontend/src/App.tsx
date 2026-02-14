import React, { useState } from 'react'
import { Web3Provider } from './context/Web3Context'
import { Container, Header, Tabs, TabId } from './components/layout'
import { ContractConfig } from './components/config'
import { IdentitiesTab } from './components/identities'
import { FeedbackTab } from './components/feedback'
import { GiveFeedbackTab } from './components/give-feedback'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('identities')

  return (
    <Container>
      <Header />
      <ContractConfig />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={`tab-content ${activeTab === 'identities' ? 'active' : ''}`}>
        {activeTab === 'identities' && <IdentitiesTab />}
      </div>

      <div className={`tab-content ${activeTab === 'feedback' ? 'active' : ''}`}>
        {activeTab === 'feedback' && <FeedbackTab />}
      </div>

      <div className={`tab-content ${activeTab === 'give-feedback' ? 'active' : ''}`}>
        {activeTab === 'give-feedback' && <GiveFeedbackTab />}
      </div>
    </Container>
  )
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}

export default App
