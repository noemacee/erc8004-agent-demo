# ERC-8004 Complete Tutorial

This tutorial walks you through understanding and implementing ERC-8004 for AI agent reputation.

## Table of Contents
1. [Understanding ERC-8004](#understanding-erc-8004)
2. [Architecture Overview](#architecture-overview)
3. [Hands-On Implementation](#hands-on-implementation)
4. [Advanced Concepts](#advanced-concepts)
5. [Real-World Integration](#real-world-integration)

---

## Understanding ERC-8004

### What Problem Does It Solve?

Imagine you're building an AI agent marketplace where agents can:
- Offer services (data analysis, trading, content creation)
- Get hired by other agents or humans
- Build reputation over time
- Prove their work is legitimate

**The Problem**: How do you know which agents to trust in a decentralized environment?

**ERC-8004 Solution**: Three interconnected registries that provide:
1. **Identity** - Who is this agent?
2. **Reputation** - How well have they performed?
3. **Validation** - Can we verify their work?

### Core Components

#### 1. Identity Registry (ERC-721 Based)
- Each agent is an NFT
- Contains metadata and service endpoints
- Transferable ownership
- Portable across platforms

**Think of it as**: A blockchain passport for AI agents

#### 2. Reputation Registry
- Stores feedback from clients
- Fixed-point value system (supports decimals)
- On-chain for composability
- Off-chain enrichment via IPFS/URIs

**Think of it as**: Yelp/TripAdvisor for AI agents

#### 3. Validation Registry
- Request/response pattern
- Supports multiple validation methods:
  - Stake-secured re-execution
  - zkML proofs
  - TEE attestations
- Cryptographic commitments

**Think of it as**: Proof of work verification system

---

## Architecture Overview

### Global Agent Identifier

Every agent has a unique global identifier:
```
eip155:{chainId}:{identityRegistryAddress}#{agentId}
```

Example:
```
eip155:11155111:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb#22
```

This identifier works across:
- Different chains (via CAIP-10)
- Different platforms
- Different applications

### Registration File Structure

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "My AI Agent",
  "description": "Agent description",
  "services": [
    {
      "name": "A2A",
      "endpoint": "https://agent.com/.well-known/agent-card.json",
      "version": "0.3.0"
    },
    {
      "name": "MCP",
      "endpoint": "https://agent.com/mcp",
      "version": "2025-06-18"
    }
  ],
  "supportedTrust": ["reputation", "crypto-economic"]
}
```

### Feedback Structure

**On-Chain** (stored in contract):
- `value`: int128 (fixed-point number)
- `valueDecimals`: uint8 (0-18)
- `tag1`, `tag2`: string (categorization)
- `isRevoked`: bool

**Off-Chain** (IPFS/URI):
- Complete feedback details
- Task context
- Payment proofs
- Additional metadata

---

## Hands-On Implementation

### Step 1: Setup Environment

```bash
# Clone or create project
git clone <your-repo>
cd erc8004-agent-demo

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your private key and RPC URL
```

### Step 2: Deploy Registries

```bash
# Deploy to local Hardhat network
npx hardhat run scripts/deploy.js --network hardhat

# Or deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

**What happens:**
1. IdentityRegistry deployed
2. ReputationRegistry deployed and initialized
3. ValidationRegistry deployed and initialized
4. Deployment info saved to `deployment-info.json`

### Step 3: Register Your Agent

```bash
npx hardhat run scripts/register-agent.js --network sepolia
```

**What happens:**
1. Creates registration file with agent metadata
2. Encodes as base64 data URI (fully on-chain)
3. Mints ERC-721 NFT representing the agent
4. Sets agentWallet to owner address
5. Saves agent info to `agent-info.json`

**Key Concepts:**
- Agent ID is auto-incremented (starts at 1)
- Owner can transfer the NFT (agent ownership)
- agentWallet is cleared on transfer (security)

### Step 4: Build Reputation

```bash
npx hardhat run scripts/give-feedback.js --network sepolia
```

**What happens:**
1. Creates three types of feedback:
   - Quality rating (5/5 stars)
   - Uptime metric (99.8%)
   - Response time (250ms)
2. Each with different tags for filtering
3. Off-chain data stored as IPFS URIs
4. On-chain summary queryable by anyone

**Feedback Examples:**

```javascript
// 5-star rating
{
  value: 5,
  valueDecimals: 0,
  tag1: "quality",
  tag2: "service"
}

// 99.8% uptime
{
  value: 998,
  valueDecimals: 1,  // Represents 99.8
  tag1: "uptime",
  tag2: "reliability"
}

// 250ms response time
{
  value: 250,
  valueDecimals: 0,
  tag1: "responseTime",
  tag2: "performance"
}
```

### Step 5: Validate Work

```bash
npx hardhat run scripts/validate.js --network sepolia
```

**What happens:**
1. Agent completes a task
2. Agent requests validation with task data hash
3. Validator verifies work (re-execution, zkML, etc.)
4. Validator submits response with confidence score
5. Results stored on-chain with tags

**Validation Flow:**
```
Agent → validationRequest()
  ↓
Validator processes off-chain
  ↓
Validator → validationResponse()
  ↓
Status stored on-chain
```

---

## Advanced Concepts

### 1. Agent Wallet Signatures

The `agentWallet` is a special metadata field for payment addresses.

**Setting agent wallet:**
```javascript
// Create EIP-712 signature
const domain = {
  name: 'IdentityRegistry',
  version: '1',
  chainId: chainId,
  verifyingContract: identityRegistryAddress
};

const types = {
  SetAgentWallet: [
    { name: 'agentId', type: 'uint256' },
    { name: 'newWallet', type: 'address' },
    { name: 'deadline', type: 'uint256' }
  ]
};

const value = {
  agentId: agentId,
  newWallet: newWalletAddress,
  deadline: Math.floor(Date.now() / 1000) + 3600
};

const signature = await signer._signTypedData(domain, types, value);

// Submit to contract
await identityRegistry.setAgentWallet(
  agentId,
  newWalletAddress,
  deadline,
  signature
);
```

### 2. Reputation Aggregation

**On-Chain Filtering:**
```solidity
// Get quality ratings from trusted clients
uint64 count;
int128 sum;
uint8 decimals;

(count, sum, decimals) = reputationRegistry.getSummary(
  agentId,
  trustedClients,  // Array of addresses
  "quality",       // Filter by tag1
  ""               // No filter on tag2
);

uint256 average = uint256(sum) / count;
```

**Off-Chain Aggregation:**
- Use subgraphs to index all feedback
- Apply sophisticated spam detection
- Weight feedback by reviewer reputation
- Calculate time-weighted averages

### 3. Validation Methods

**Stake-Secured Re-execution:**
```javascript
// Validator stakes tokens
// Re-runs the agent's computation
// If output matches → agent gets paid
// If mismatch → validator can slash stake
```

**zkML Proofs:**
```javascript
// Agent generates zero-knowledge proof
// Proves computation was done correctly
// No need to reveal inputs
// Mathematically verifiable
```

**TEE Attestations:**
```javascript
// Agent runs in Trusted Execution Environment
// Hardware-backed attestation
// Cryptographic proof of execution
```

### 4. Cross-Chain Reputation

Agents can register on multiple chains:
```json
{
  "registrations": [
    {
      "agentId": 22,
      "agentRegistry": "eip155:1:0x742..."     // Mainnet
    },
    {
      "agentId": 15,
      "agentRegistry": "eip155:42161:0x123..." // Arbitrum
    }
  ]
}
```

Reputation aggregators can:
- Query all chains
- Combine feedback
- Create unified reputation score

---

## Real-World Integration

### Integration with A2A (Agent-to-Agent)

```javascript
// Agent Card includes ERC-8004 identity
{
  "id": "eip155:11155111:0x742...#22",
  "name": "Data Analysis Agent",
  "skills": [
    {
      "name": "analyze_data",
      "description": "Statistical analysis"
    }
  ],
  "erc8004": {
    "identityRegistry": "0x742...",
    "agentId": 22,
    "reputationScore": 4.8,
    "validationCount": 150
  }
}
```

### Integration with MCP (Model Context Protocol)

```javascript
// MCP server includes reputation in responses
{
  "tools": [
    {
      "name": "analyze",
      "description": "Analyze dataset",
      "erc8004Reputation": {
        "agentId": 22,
        "averageRating": 4.8,
        "totalFeedback": 342
      }
    }
  ]
}
```

### Building a Reputation Aggregator

```javascript
class ReputationAggregator {
  async getAgentScore(agentId) {
    // 1. Fetch all feedback from blockchain
    const feedback = await this.fetchFeedback(agentId);
    
    // 2. Apply spam detection
    const filtered = this.filterSpam(feedback);
    
    // 3. Weight by reviewer reputation
    const weighted = this.applyWeights(filtered);
    
    // 4. Calculate time-weighted average
    const score = this.calculateScore(weighted);
    
    return score;
  }
  
  filterSpam(feedback) {
    // Detect Sybil attacks
    // Check for suspicious patterns
    // Verify reviewer credentials
    return filtered;
  }
}
```

### Building an Agent Marketplace

```javascript
class AgentMarketplace {
  async listAgents() {
    // Query all registered agents
    const totalAgents = await identityRegistry.getNextAgentId();
    
    const agents = [];
    for (let i = 1; i < totalAgents; i++) {
      const owner = await identityRegistry.ownerOf(i);
      const uri = await identityRegistry.tokenURI(i);
      const reputation = await this.getReputation(i);
      
      agents.push({
        agentId: i,
        owner,
        registrationFile: await this.fetchURI(uri),
        reputation
      });
    }
    
    return agents;
  }
  
  async hireAgent(agentId, taskDetails) {
    // 1. Check agent reputation
    const reputation = await this.getReputation(agentId);
    if (reputation.score < 4.0) {
      throw new Error('Agent reputation too low');
    }
    
    // 2. Request validation for high-value tasks
    if (taskDetails.value > 1000) {
      await this.requestValidation(agentId);
    }
    
    // 3. Execute task...
  }
}
```

---

## Testing

Run the test suite:
```bash
npx hardhat test
```

Key test scenarios:
1. **Identity Registry**
   - Agent registration
   - URI updates
   - Metadata management
   - Agent wallet signatures
   - NFT transfers

2. **Reputation Registry**
   - Feedback submission
   - Summary calculations
   - Tag filtering
   - Feedback revocation

3. **Validation Registry**
   - Request creation
   - Response submission
   - Status queries
   - Summary statistics

---

## Best Practices

### For Agent Developers

1. **Registration File**
   - Keep on IPFS for immutability
   - Update URI when services change
   - Include all relevant endpoints

2. **Building Reputation**
   - Encourage satisfied clients to leave feedback
   - Request validation for important tasks
   - Respond to negative feedback professionally

3. **Validation Strategy**
   - Use zkML for privacy-sensitive tasks
   - Use stake-secured for high-value tasks
   - Use TEE for performance-critical tasks

### For Client Developers

1. **Checking Reputation**
   - Don't rely solely on average
   - Check recent feedback trends
   - Filter by relevant tags
   - Verify validation history

2. **Giving Feedback**
   - Be specific with tags
   - Include task context in off-chain data
   - Use appropriate value scales

### Security Considerations

1. **Sybil Attacks**
   - Filter by trusted reviewers
   - Weight by reviewer reputation
   - Look for suspicious patterns

2. **Validator Collusion**
   - Use multiple validators
   - Require stake from validators
   - Implement slashing conditions

3. **Privacy**
   - Don't expose sensitive data in feedback
   - Use zkML for private validations
   - Consider TEE for confidential tasks

---

## Next Steps

1. **Experiment** with the demo scripts
2. **Build** your own agent service
3. **Integrate** with A2A or MCP
4. **Deploy** to mainnet or L2s
5. **Contribute** to the ERC-8004 ecosystem

## Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Ethereum Magicians Discussion](https://ethereum-magicians.org/t/erc-8004-trustless-agents/)
- [Agent-to-Agent Protocol](https://github.com/google/A2A)
- [Model Context Protocol](https://modelcontextprotocol.io)
