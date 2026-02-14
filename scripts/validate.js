const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("ERC-8004 Validation Registry Demo...\n");

  // Load deployment and agent info
  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const agentInfo = JSON.parse(fs.readFileSync("agent-info.json", "utf8"));

  const validationAddress = deploymentInfo.contracts.validationRegistry;
  const agentId = agentInfo.agentId;

  // Get signers (using same account for both roles in demo)
  const [agentOwner] = await ethers.getSigners();
  const validator = agentOwner; // Same wallet acts as validator for demo
  console.log("Agent Owner:", agentOwner.address);
  console.log("Validator:", validator.address, "(same as owner for demo)");
  console.log("Agent ID:", agentId);
  console.log();

  // Connect to Validation Registry
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = ValidationRegistry.attach(validationAddress);

  // Scenario: Agent completes a task and requests validation
  console.log("=".repeat(60));
  console.log("SCENARIO: Validating Agent Task Completion");
  console.log("=".repeat(60));
  console.log();

  // Create validation request data
  const taskData = {
    taskId: "task-12345",
    description: "Data analysis on customer dataset",
    input: {
      dataset: "ipfs://QmCustomerData...",
      parameters: {
        analysis_type: "sentiment",
        sample_size: 1000
      }
    },
    output: {
      results: "ipfs://QmAnalysisResults...",
      summary: {
        positive: 650,
        neutral: 250,
        negative: 100
      }
    },
    timestamp: new Date().toISOString()
  };

  const requestJSON = JSON.stringify(taskData, null, 2);
  const requestHash = ethers.keccak256(ethers.toUtf8Bytes(requestJSON));
  const requestURI = `ipfs://Qm${requestHash.slice(2, 48)}`; // Simulated IPFS CID

  console.log("Task Details:");
  console.log(`  Task ID: ${taskData.taskId}`);
  console.log(`  Description: ${taskData.description}`);
  console.log(`  Request URI: ${requestURI}`);
  console.log(`  Request Hash: ${requestHash}`);
  console.log();

  // 1. Agent requests validation
  console.log("Step 1: Agent requests validation...");
  const requestTx = await validationRegistry.connect(agentOwner).validationRequest(
    validator.address,
    agentId,
    requestURI,
    requestHash
  );
  await requestTx.wait();
  console.log("✓ Validation request submitted");
  console.log();

  // 2. Validator processes and responds
  console.log("Step 2: Validator performs verification...");
  console.log("  (In production, validator would re-run analysis, check zkML proof, etc.)");
  
  // Simulate validator work
  await new Promise(resolve => setTimeout(resolve, 1000));

  const validationResponse = {
    requestHash: requestHash,
    verified: true,
    confidence: 95,
    method: "stake-secured-reexecution",
    details: {
      reexecutionMatches: true,
      inputValid: true,
      outputValid: true,
      stakeAmount: "1000000000000000000", // 1 ETH
      slashingRisk: "100000000000000000"   // 0.1 ETH
    },
    timestamp: new Date().toISOString()
  };

  const responseJSON = JSON.stringify(validationResponse, null, 2);
  const responseHash = ethers.keccak256(ethers.toUtf8Bytes(responseJSON));
  const responseURI = `ipfs://Qm${responseHash.slice(2, 48)}`;

  console.log();
  console.log("Validation Results:");
  console.log(`  Verified: ${validationResponse.verified}`);
  console.log(`  Confidence: ${validationResponse.confidence}%`);
  console.log(`  Method: ${validationResponse.method}`);
  console.log(`  Response URI: ${responseURI}`);
  console.log();

  // Submit validation response (95/100 = high confidence pass)
  console.log("Step 3: Validator submits response...");
  const responseTx = await validationRegistry.connect(validator).validationResponse(
    requestHash,
    95, // 95% confidence
    responseURI,
    responseHash,
    "stake-secured" // tag
  );
  await responseTx.wait();
  console.log("✓ Validation response submitted");
  console.log();

  // 3. Query validation status
  console.log("=".repeat(60));
  console.log("VALIDATION STATUS");
  console.log("=".repeat(60));

  const status = await validationRegistry.getValidationStatus(requestHash);
  console.log("Validator:", status.validatorAddress);
  console.log("Agent ID:", status.agentId.toString());
  console.log("Response Score:", status.response, "/ 100");
  console.log("Tag:", status.tag);
  console.log("Last Update:", new Date(Number(status.lastUpdate) * 1000).toISOString());
  console.log();

  // Get agent validation summary
  const summary = await validationRegistry.getSummary(
    agentId,
    [],
    ""
  );
  console.log("Agent Validation Summary:");
  console.log(`  Total Validations: ${summary.count}`);
  console.log(`  Average Score: ${summary.averageResponse} / 100`);
  console.log();

  // Additional scenario: Multiple validations with different tags
  console.log("=".repeat(60));
  console.log("ADDITIONAL VALIDATION: zkML Proof");
  console.log("=".repeat(60));
  console.log();

  const zkmlRequestData = {
    taskId: "task-67890",
    description: "Image classification with ML model",
    zkProof: "0x1234567890abcdef...",
    modelHash: "0xabcdef1234567890...",
    timestamp: new Date().toISOString()
  };

  const zkmlRequestJSON = JSON.stringify(zkmlRequestData);
  const zkmlRequestHash = ethers.keccak256(ethers.toUtf8Bytes(zkmlRequestJSON));
  const zkmlRequestURI = `ipfs://Qm${zkmlRequestHash.slice(2, 48)}`;

  console.log("Submitting zkML validation request...");
  const zkmlReqTx = await validationRegistry.connect(agentOwner).validationRequest(
    validator.address,
    agentId,
    zkmlRequestURI,
    zkmlRequestHash
  );
  await zkmlReqTx.wait();

  console.log("Validator verifies zkML proof...");
  await new Promise(resolve => setTimeout(resolve, 500));

  const zkmlResponseTx = await validationRegistry.connect(validator).validationResponse(
    zkmlRequestHash,
    100, // Perfect score for valid zkML proof
    "ipfs://QmZkmlProofVerified",
    ethers.ZeroHash,
    "zkml" // tag
  );
  await zkmlResponseTx.wait();
  console.log("✓ zkML validation completed with score: 100/100");
  console.log();

  // Final summary with tag filtering
  console.log("=".repeat(60));
  console.log("FINAL VALIDATION SUMMARY");
  console.log("=".repeat(60));

  const allValidations = await validationRegistry.getAgentValidations(agentId);
  console.log(`Total Validation Requests: ${allValidations.length}`);
  console.log();

  // Get summary by tag
  const stakeSecuredSummary = await validationRegistry.getSummary(
    agentId,
    [],
    "stake-secured"
  );
  console.log("Stake-Secured Validations:");
  console.log(`  Count: ${stakeSecuredSummary.count}`);
  console.log(`  Average: ${stakeSecuredSummary.averageResponse}/100`);
  console.log();

  const zkmlSummary = await validationRegistry.getSummary(
    agentId,
    [],
    "zkml"
  );
  console.log("zkML Validations:");
  console.log(`  Count: ${zkmlSummary.count}`);
  console.log(`  Average: ${zkmlSummary.averageResponse}/100`);
  console.log();

  const overallSummary = await validationRegistry.getSummary(
    agentId,
    [],
    ""
  );
  console.log("Overall Validation Performance:");
  console.log(`  Total Count: ${overallSummary.count}`);
  console.log(`  Overall Average: ${overallSummary.averageResponse}/100`);
  console.log();

  console.log("=".repeat(60));
  console.log("✓ Validation demo complete!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
