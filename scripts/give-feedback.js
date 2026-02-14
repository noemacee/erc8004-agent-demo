const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Giving Feedback to Agent via ERC-8004...\n");

  // Load deployment and agent info
  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const agentInfo = JSON.parse(fs.readFileSync("agent-info.json", "utf8"));

  const reputationAddress = deploymentInfo.contracts.reputationRegistry;
  const agentId = agentInfo.agentId;

  // Get signer (as client)
  const [client] = await ethers.getSigners();
  console.log("Client address:", client.address);
  console.log("Giving feedback to Agent ID:", agentId);
  console.log();

  // Connect to Reputation Registry
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = ReputationRegistry.attach(reputationAddress);

  // Create feedback scenarios
  const feedbackExamples = [
    {
      description: "Excellent service - 5 stars",
      value: 5,
      valueDecimals: 0,
      tag1: "quality",
      tag2: "service",
      endpoint: "https://demo-agent.example.com/",
      offChainData: {
        agentRegistry: agentInfo.agentRegistry,
        agentId: parseInt(agentId),
        clientAddress: `eip155:${deploymentInfo.chainId}:${client.address}`,
        createdAt: new Date().toISOString(),
        value: 5,
        valueDecimals: 0,
        tag1: "quality",
        tag2: "service",
        endpoint: "https://demo-agent.example.com/",
        comment: "The agent provided excellent analysis of the dataset. Fast, accurate, and easy to work with.",
        a2a: {
          skills: ["data_analysis"],
          taskId: "task-001"
        }
      }
    },
    {
      description: "Good uptime - 99.8%",
      value: 998,
      valueDecimals: 1,
      tag1: "uptime",
      tag2: "reliability",
      endpoint: "https://demo-agent.example.com/",
      offChainData: {
        agentRegistry: agentInfo.agentRegistry,
        agentId: parseInt(agentId),
        clientAddress: `eip155:${deploymentInfo.chainId}:${client.address}`,
        createdAt: new Date().toISOString(),
        value: 998,
        valueDecimals: 1,
        tag1: "uptime",
        tag2: "reliability",
        endpoint: "https://demo-agent.example.com/",
        comment: "Monitoring shows consistent uptime over the past 30 days."
      }
    },
    {
      description: "Fast response - 250ms average",
      value: 250,
      valueDecimals: 0,
      tag1: "responseTime",
      tag2: "performance",
      endpoint: "https://demo-agent.example.com/mcp",
      offChainData: {
        agentRegistry: agentInfo.agentRegistry,
        agentId: parseInt(agentId),
        clientAddress: `eip155:${deploymentInfo.chainId}:${client.address}`,
        createdAt: new Date().toISOString(),
        value: 250,
        valueDecimals: 0,
        tag1: "responseTime",
        tag2: "performance",
        endpoint: "https://demo-agent.example.com/mcp",
        comment: "Average response time measured over 1000 requests.",
        mcp: {
          tool: "analyze_data"
        }
      }
    }
  ];

  // Give feedback for each example
  for (let i = 0; i < feedbackExamples.length; i++) {
    const feedback = feedbackExamples[i];
    
    console.log(`Feedback ${i + 1}/${feedbackExamples.length}: ${feedback.description}`);
    console.log(`  Value: ${feedback.value} (decimals: ${feedback.valueDecimals})`);
    console.log(`  Tags: ${feedback.tag1}, ${feedback.tag2}`);

    // Create IPFS-style URI (simulated for demo)
    const feedbackJSON = JSON.stringify(feedback.offChainData, null, 2);
    const feedbackHash = ethers.keccak256(ethers.toUtf8Bytes(feedbackJSON));
    const feedbackURI = `ipfs://Qm${feedbackHash.slice(2, 48)}`; // Simulated IPFS CID

    console.log(`  Off-chain URI: ${feedbackURI}`);

    // Submit feedback
    const tx = await reputationRegistry.giveFeedback(
      agentId,
      feedback.value,
      feedback.valueDecimals,
      feedback.tag1,
      feedback.tag2,
      feedback.endpoint,
      feedbackURI,
      ethers.ZeroHash // Not needed for IPFS URIs
    );

    const receipt = await tx.wait();
    console.log(`  ✓ Feedback submitted (tx: ${receipt.hash})`);
    console.log();
  }

  // Query feedback summary
  console.log("=".repeat(60));
  console.log("REPUTATION SUMMARY");
  console.log("=".repeat(60));

  // Get all clients
  const clientsResult = await reputationRegistry.getClients(agentId);
  const clients = [...clientsResult]; // Copy to mutable array
  console.log("Clients who gave feedback:", clients.length);

  // Get summary for quality ratings
  const qualitySummary = await reputationRegistry.getSummary(
    agentId,
    clients,
    "quality",
    ""
  );
  console.log("\nQuality Ratings:");
  console.log(`  Count: ${qualitySummary.count}`);
  console.log(`  Total Value: ${qualitySummary.summaryValue}`);
  if (qualitySummary.count > 0) {
    const avg = Number(qualitySummary.summaryValue) / Number(qualitySummary.count);
    console.log(`  Average: ${avg.toFixed(2)}`);
  }

  // Get summary for uptime
  const uptimeSummary = await reputationRegistry.getSummary(
    agentId,
    clients,
    "uptime",
    ""
  );
  console.log("\nUptime Metrics:");
  console.log(`  Count: ${uptimeSummary.count}`);
  if (uptimeSummary.count > 0) {
    const uptimeValue = Number(uptimeSummary.summaryValue) / Math.pow(10, Number(uptimeSummary.summaryValueDecimals));
    console.log(`  Value: ${uptimeValue}%`);
  }

  // Get summary for response time
  const responseSummary = await reputationRegistry.getSummary(
    agentId,
    clients,
    "responseTime",
    ""
  );
  console.log("\nResponse Time:");
  console.log(`  Count: ${responseSummary.count}`);
  if (responseSummary.count > 0) {
    const avgResponseTime = Number(responseSummary.summaryValue) / Number(responseSummary.count);
    console.log(`  Average: ${avgResponseTime}ms`);
  }

  // Read all feedback
  console.log("\n" + "=".repeat(60));
  console.log("ALL FEEDBACK ENTRIES");
  console.log("=".repeat(60));

  const allFeedback = await reputationRegistry.readAllFeedback(
    agentId,
    [],
    "",
    "",
    false
  );

  for (let i = 0; i < allFeedback.clients.length; i++) {
    console.log(`\nFeedback ${i + 1}:`);
    console.log(`  Client: ${allFeedback.clients[i]}`);
    console.log(`  Index: ${allFeedback.feedbackIndexes[i]}`);
    console.log(`  Value: ${allFeedback.values[i]} (decimals: ${allFeedback.valueDecimals[i]})`);
    console.log(`  Tags: ${allFeedback.tag1s[i]}, ${allFeedback.tag2s[i]}`);
    console.log(`  Revoked: ${allFeedback.revokedStatuses[i]}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✓ Feedback interaction complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
