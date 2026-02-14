const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ERC-8004 Registries...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log();

  // 1. Deploy Identity Registry
  console.log("Deploying Identity Registry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("✓ Identity Registry deployed to:", identityAddress);
  console.log();

  // 2. Deploy Reputation Registry
  console.log("Deploying Reputation Registry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy();
  await reputationRegistry.waitForDeployment();
  const reputationAddress = await reputationRegistry.getAddress();
  console.log("✓ Reputation Registry deployed to:", reputationAddress);
  
  // Initialize Reputation Registry
  console.log("Initializing Reputation Registry...");
  const initRepTx = await reputationRegistry.initialize(identityAddress);
  await initRepTx.wait();
  console.log("✓ Reputation Registry initialized");
  console.log();

  // 3. Deploy Validation Registry
  console.log("Deploying Validation Registry...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = await ValidationRegistry.deploy();
  await validationRegistry.waitForDeployment();
  const validationAddress = await validationRegistry.getAddress();
  console.log("✓ Validation Registry deployed to:", validationAddress);
  
  // Initialize Validation Registry
  console.log("Initializing Validation Registry...");
  const initValTx = await validationRegistry.initialize(identityAddress);
  await initValTx.wait();
  console.log("✓ Validation Registry initialized");
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      identityRegistry: identityAddress,
      reputationRegistry: reputationAddress,
      validationRegistry: validationAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("=".repeat(60));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✓ Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
