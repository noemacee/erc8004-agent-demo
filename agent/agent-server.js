const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');

/**
 * Simple AI Agent Server with ERC-8004 Integration
 * 
 * This demonstrates how an AI agent might expose services
 * while integrating with the ERC-8004 reputation system.
 */

const app = express();
app.use(express.json());

// Load configuration
let agentInfo = {};
try {
  agentInfo = JSON.parse(fs.readFileSync('agent-info.json', 'utf8'));
} catch (err) {
  console.log('No agent-info.json found. Run register-agent.js first.');
}

// Agent capabilities
const CAPABILITIES = {
  analyze_sentiment: {
    description: "Analyze sentiment of text",
    parameters: ["text"],
    returns: "sentiment score (-1 to 1)"
  },
  summarize_text: {
    description: "Summarize long text",
    parameters: ["text", "max_length"],
    returns: "summary string"
  },
  extract_keywords: {
    description: "Extract keywords from text",
    parameters: ["text", "count"],
    returns: "array of keywords"
  }
};

// Simple in-memory task storage
const tasks = new Map();

// ===== A2A (Agent-to-Agent) Endpoints =====

// Agent Card endpoint
app.get('/.well-known/agent-card.json', (req, res) => {
  const agentCard = {
    id: agentInfo.globalIdentifier || "unknown",
    name: agentInfo.registrationFile?.name || "Demo Agent",
    description: agentInfo.registrationFile?.description || "AI Agent",
    version: "1.0.0",
    skills: Object.keys(CAPABILITIES).map(name => ({
      name,
      description: CAPABILITIES[name].description,
      parameters: CAPABILITIES[name].parameters
    })),
    erc8004: {
      agentId: agentInfo.agentId,
      agentRegistry: agentInfo.agentRegistry,
      registeredAt: agentInfo.timestamp
    }
  };
  
  res.json(agentCard);
});

// Task creation endpoint
app.post('/tasks', (req, res) => {
  const { skill, parameters } = req.body;
  
  if (!CAPABILITIES[skill]) {
    return res.status(400).json({ error: 'Unknown skill' });
  }
  
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  tasks.set(taskId, {
    id: taskId,
    skill,
    parameters,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  
  // Simulate async processing
  setTimeout(() => executeTask(taskId), 1000);
  
  res.json({
    taskId,
    status: 'pending',
    statusUrl: `/tasks/${taskId}`
  });
});

// Task status endpoint
app.get('/tasks/:taskId', (req, res) => {
  const task = tasks.get(req.params.taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

// ===== MCP (Model Context Protocol) Endpoints =====

app.get('/mcp/capabilities', (req, res) => {
  res.json({
    tools: Object.keys(CAPABILITIES).map(name => ({
      name,
      description: CAPABILITIES[name].description,
      inputSchema: {
        type: "object",
        properties: CAPABILITIES[name].parameters.reduce((acc, param) => {
          acc[param] = { type: "string" };
          return acc;
        }, {}),
        required: CAPABILITIES[name].parameters
      }
    }))
  });
});

app.post('/mcp/tools/:toolName', (req, res) => {
  const { toolName } = req.params;
  const parameters = req.body;
  
  if (!CAPABILITIES[toolName]) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  
  const result = executeCapability(toolName, parameters);
  
  res.json({
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2)
      }
    ]
  });
});

// ===== Reputation Integration =====

app.get('/reputation', async (req, res) => {
  // In production, query the blockchain
  res.json({
    agentId: agentInfo.agentId,
    placeholder: "In production, this would query ReputationRegistry",
    example: {
      averageRating: 4.8,
      totalFeedback: 342,
      recentFeedback: [
        { value: 5, tag1: "quality", timestamp: "2025-02-14" }
      ]
    }
  });
});

app.get('/validations', async (req, res) => {
  // In production, query the blockchain
  res.json({
    agentId: agentInfo.agentId,
    placeholder: "In production, this would query ValidationRegistry",
    example: {
      totalValidations: 150,
      averageScore: 95,
      validationTypes: {
        "zkml": 80,
        "stake-secured": 70
      }
    }
  });
});

// ===== Agent Logic =====

function executeTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return;
  
  try {
    const result = executeCapability(task.skill, task.parameters);
    
    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date().toISOString();
    
    tasks.set(taskId, task);
  } catch (error) {
    task.status = 'failed';
    task.error = error.message;
    tasks.set(taskId, task);
  }
}

function executeCapability(skill, parameters) {
  switch (skill) {
    case 'analyze_sentiment':
      return analyzeSentiment(parameters.text);
    
    case 'summarize_text':
      return summarizeText(parameters.text, parameters.max_length || 100);
    
    case 'extract_keywords':
      return extractKeywords(parameters.text, parameters.count || 5);
    
    default:
      throw new Error('Unknown skill');
  }
}

// Simple sentiment analysis (demo only)
function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 0.2;
    if (negativeWords.includes(word)) score -= 0.2;
  });
  
  return {
    sentiment: Math.max(-1, Math.min(1, score)),
    label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
  };
}

// Simple text summarization (demo only)
function summarizeText(text, maxLength) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let summary = '';
  
  for (const sentence of sentences) {
    if ((summary + sentence).length <= maxLength) {
      summary += sentence + '. ';
    } else {
      break;
    }
  }
  
  return summary.trim() || text.substring(0, maxLength) + '...';
}

// Simple keyword extraction (demo only)
function extractKeywords(text, count) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  const wordFreq = {};
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
  
  return sorted.map(([word, freq]) => ({ word, frequency: freq }));
}

// ===== Start Server =====

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 ERC-8004 AI Agent Server');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log();
  
  if (agentInfo.agentId) {
    console.log('Agent Information:');
    console.log(`  Agent ID: ${agentInfo.agentId}`);
    console.log(`  Global ID: ${agentInfo.globalIdentifier}`);
    console.log(`  Owner: ${agentInfo.owner}`);
  } else {
    console.log('⚠️  No agent registered. Run: npm run register-agent');
  }
  
  console.log();
  console.log('Available Endpoints:');
  console.log(`  Agent Card:  http://localhost:${PORT}/.well-known/agent-card.json`);
  console.log(`  MCP Tools:   http://localhost:${PORT}/mcp/capabilities`);
  console.log(`  Create Task: POST http://localhost:${PORT}/tasks`);
  console.log(`  Reputation:  http://localhost:${PORT}/reputation`);
  console.log(`  Validations: http://localhost:${PORT}/validations`);
  console.log('='.repeat(60));
  console.log();
});

module.exports = app;
