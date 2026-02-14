const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Registering Agent on ERC-8004...\n");

  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const identityAddress = deploymentInfo.contracts.identityRegistry;

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Registering agent with account:", signer.address);
  console.log();

  // Connect to Identity Registry
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = IdentityRegistry.attach(identityAddress);

  // Create agent registration file
  const registrationFile = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "Demo AI Agent",
    description: "A demonstration AI agent for learning ERC-8004. This agent provides simple text processing and data analysis capabilities.",
    image: "https://example.com/agent-avatar.png",
    services: [
      {
        name: "web",
        endpoint: "https://demo-agent.example.com/"
      },
      {
        name: "A2A",
        endpoint: "https://demo-agent.example.com/.well-known/agent-card.json",
        version: "0.3.0"
      },
      {
        name: "MCP",
        endpoint: "https://demo-agent.example.com/mcp",
        version: "2025-06-18"
      }
    ],
    x402Support: false,
    active: true,
    registrations: [
      {
        agentId: 0, // Will be filled after registration
        agentRegistry: `eip155:${deploymentInfo.chainId}:${identityAddress}`
      }
    ],
    supportedTrust: [
      "reputation",
      "crypto-economic"
    ]
  };

  // For demo, we'll use a data URI (fully on-chain)
  const registrationJSON = JSON.stringify(registrationFile);
  const base64Data = Buffer.from(registrationJSON).toString('base64');
  const agentURI = `data:application/json;base64,${base64Data}`;

  console.log("Agent Registration Details:");
  console.log("- Name:", registrationFile.name);
  console.log("- Description:", registrationFile.description);
  console.log("- Services:", registrationFile.services.map(s => s.name).join(", "));
  console.log("- Trust Models:", registrationFile.supportedTrust.join(", "));
  console.log();

  // Register the agent
  console.log("Submitting registration transaction...");
  const registerTx = await identityRegistry.register(agentURI, []);
  const receipt = await registerTx.wait();
  
  // Extract agent ID from events
  const registeredEvent = receipt.logs.find(
    log => {
      try {
        return identityRegistry.interface.parseLog(log).name === "Registered";
      } catch {
        return false;
      }
    }
  );
  
  const parsedEvent = identityRegistry.interface.parseLog(registeredEvent);
  const agentId = parsedEvent.args.agentId;

  console.log("✓ Agent registered successfully!");
  console.log();
  console.log("=".repeat(60));
  console.log("AGENT INFORMATION");
  console.log("=".repeat(60));
  console.log("Agent ID:", agentId.toString());
  console.log("Agent Registry:", `eip155:${deploymentInfo.chainId}:${identityAddress}`);
  console.log("Global Agent Identifier:", `eip155:${deploymentInfo.chainId}:${identityAddress}#${agentId}`);
  console.log("Owner:", signer.address);
  console.log("Transaction Hash:", receipt.hash);
  console.log("=".repeat(60));

  // Save agent info
  const agentInfo = {
    agentId: agentId.toString(),
    agentRegistry: `eip155:${deploymentInfo.chainId}:${identityAddress}`,
    globalIdentifier: `eip155:${deploymentInfo.chainId}:${identityAddress}#${agentId}`,
    owner: signer.address,
    registrationFile: registrationFile,
    transactionHash: receipt.hash,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "agent-info.json",
    JSON.stringify(agentInfo, null, 2)
  );
  console.log("\n✓ Agent info saved to agent-info.json");

  // Verify registration
  console.log("\nVerifying registration...");
  const owner = await identityRegistry.ownerOf(agentId);
  const uri = await identityRegistry.tokenURI(agentId);
  const agentWallet = await identityRegistry.getAgentWallet(agentId);
  
  console.log("✓ Owner verified:", owner);
  console.log("✓ Agent wallet:", agentWallet);
  console.log("✓ Token URI length:", uri.length, "characters");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
