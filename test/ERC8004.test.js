const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC-8004 Registries", function () {
  let identityRegistry;
  let reputationRegistry;
  let validationRegistry;
  let owner;
  let client;
  let validator;

  beforeEach(async function () {
    [owner, client, validator] = await ethers.getSigners();

    // Deploy Identity Registry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy Reputation Registry
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    reputationRegistry = await ReputationRegistry.deploy();
    await reputationRegistry.waitForDeployment();
    await reputationRegistry.initialize(await identityRegistry.getAddress());

    // Deploy Validation Registry
    const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
    validationRegistry = await ValidationRegistry.deploy();
    await validationRegistry.waitForDeployment();
    await validationRegistry.initialize(await identityRegistry.getAddress());
  });

  describe("Identity Registry", function () {
    it("Should register an agent", async function () {
      const agentURI = "ipfs://QmTest123";
      const tx = await identityRegistry.register(agentURI);
      const receipt = await tx.wait();

      const agentId = await identityRegistry.getNextAgentId() - 1n;
      expect(await identityRegistry.ownerOf(agentId)).to.equal(owner.address);
      expect(await identityRegistry.tokenURI(agentId)).to.equal(agentURI);
    });

    it("Should set and get metadata", async function () {
      const agentURI = "ipfs://QmTest123";
      await identityRegistry.register(agentURI);
      const agentId = await identityRegistry.getNextAgentId() - 1n;

      const metadata = ethers.toUtf8Bytes("test metadata");
      await identityRegistry.setMetadata(agentId, "customKey", metadata);

      const retrieved = await identityRegistry.getMetadata(agentId, "customKey");
      expect(retrieved).to.equal(ethers.hexlify(metadata));
    });

    it("Should update agent URI", async function () {
      await identityRegistry.register("ipfs://QmOld");
      const agentId = await identityRegistry.getNextAgentId() - 1n;

      const newURI = "ipfs://QmNew";
      await identityRegistry.setAgentURI(agentId, newURI);

      expect(await identityRegistry.tokenURI(agentId)).to.equal(newURI);
    });

    it("Should handle agent wallet", async function () {
      await identityRegistry.register("ipfs://QmTest");
      const agentId = await identityRegistry.getNextAgentId() - 1n;

      // Agent wallet should be set to owner by default
      expect(await identityRegistry.getAgentWallet(agentId)).to.equal(owner.address);

      // Unset agent wallet
      await identityRegistry.unsetAgentWallet(agentId);
      expect(await identityRegistry.getAgentWallet(agentId)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Reputation Registry", function () {
    let agentId;

    beforeEach(async function () {
      await identityRegistry.register("ipfs://QmTest");
      agentId = await identityRegistry.getNextAgentId() - 1n;
    });

    it("Should give feedback", async function () {
      await reputationRegistry.connect(client).giveFeedback(
        agentId,
        5,      // value
        0,      // decimals
        "quality",
        "service",
        "https://agent.com",
        "ipfs://QmFeedback",
        ethers.ZeroHash
      );

      const feedback = await reputationRegistry.readFeedback(agentId, client.address, 1);
      expect(feedback.value).to.equal(5);
      expect(feedback.tag1).to.equal("quality");
    });

    it("Should get summary statistics", async function () {
      // Give multiple feedback entries
      await reputationRegistry.connect(client).giveFeedback(
        agentId, 5, 0, "quality", "", "", "", ethers.ZeroHash
      );
      await reputationRegistry.connect(client).giveFeedback(
        agentId, 4, 0, "quality", "", "", "", ethers.ZeroHash
      );

      const clients = await reputationRegistry.getClients(agentId);
      const summary = await reputationRegistry.getSummary(
        agentId,
        clients,
        "quality",
        ""
      );

      expect(summary.count).to.equal(2);
      expect(summary.summaryValue).to.equal(9); // 5 + 4
    });

    it("Should revoke feedback", async function () {
      await reputationRegistry.connect(client).giveFeedback(
        agentId, 5, 0, "quality", "", "", "", ethers.ZeroHash
      );

      await reputationRegistry.connect(client).revokeFeedback(agentId, 1);

      const feedback = await reputationRegistry.readFeedback(agentId, client.address, 1);
      expect(feedback.isRevoked).to.be.true;
    });
  });

  describe("Validation Registry", function () {
    let agentId;
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes("test request"));

    beforeEach(async function () {
      await identityRegistry.register("ipfs://QmTest");
      agentId = await identityRegistry.getNextAgentId() - 1n;
    });

    it("Should create validation request", async function () {
      await validationRegistry.validationRequest(
        validator.address,
        agentId,
        "ipfs://QmRequest",
        requestHash
      );

      const validations = await validationRegistry.getAgentValidations(agentId);
      expect(validations.length).to.equal(1);
      expect(validations[0]).to.equal(requestHash);
    });

    it("Should submit validation response", async function () {
      await validationRegistry.validationRequest(
        validator.address,
        agentId,
        "ipfs://QmRequest",
        requestHash
      );

      await validationRegistry.connect(validator).validationResponse(
        requestHash,
        95, // response score
        "ipfs://QmResponse",
        ethers.ZeroHash,
        "zkml"
      );

      const status = await validationRegistry.getValidationStatus(requestHash);
      expect(status.response).to.equal(95);
      expect(status.tag).to.equal("zkml");
    });

    it("Should get validation summary", async function () {
      const requestHash2 = ethers.keccak256(ethers.toUtf8Bytes("test request 2"));

      // Submit two validations
      await validationRegistry.validationRequest(
        validator.address, agentId, "ipfs://QmRequest1", requestHash
      );
      await validationRegistry.connect(validator).validationResponse(
        requestHash, 100, "", ethers.ZeroHash, "zkml"
      );

      await validationRegistry.validationRequest(
        validator.address, agentId, "ipfs://QmRequest2", requestHash2
      );
      await validationRegistry.connect(validator).validationResponse(
        requestHash2, 90, "", ethers.ZeroHash, "zkml"
      );

      const summary = await validationRegistry.getSummary(agentId, [], "zkml");
      expect(summary.count).to.equal(2);
      expect(summary.averageResponse).to.equal(95); // (100 + 90) / 2
    });
  });
});
