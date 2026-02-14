// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReputationRegistry
 * @notice ERC-8004 Reputation Registry - Manages feedback for agents
 * @dev Stores on-chain feedback signals with off-chain enrichment via URIs
 */
contract ReputationRegistry {
    // Reference to Identity Registry
    address public identityRegistry;

    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
    }

    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) private _feedback;

    // agentId => clientAddress => last feedback index
    mapping(uint256 => mapping(address => uint64)) private _lastIndex;

    // agentId => array of client addresses
    mapping(uint256 => address[]) private _clients;

    // Events
    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
    );

    /**
     * @notice Initialize the reputation registry
     * @param identityRegistry_ Address of the identity registry
     */
    function initialize(address identityRegistry_) external {
        require(identityRegistry == address(0), "Already initialized");
        require(identityRegistry_ != address(0), "Invalid registry address");
        identityRegistry = identityRegistry_;
    }

    /**
     * @notice Get the identity registry address
     * @return The identity registry address
     */
    function getIdentityRegistry() external view returns (address) {
        return identityRegistry;
    }

    /**
     * @notice Give feedback to an agent
     * @param agentId The agent ID
     * @param value The feedback value (fixed-point)
     * @param valueDecimals Decimals for the value (0-18)
     * @param tag1 First tag (optional)
     * @param tag2 Second tag (optional)
     * @param endpoint Endpoint being rated (optional)
     * @param feedbackURI URI to off-chain feedback file (optional)
     * @param feedbackHash Hash of feedback file content (optional, not needed for IPFS)
     */
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        require(valueDecimals <= 18, "Invalid decimals");
        require(_isValidAgent(agentId), "Invalid agent");
        require(!_isAgentOwnerOrOperator(agentId, msg.sender), "Agent cannot self-rate");

        uint64 feedbackIndex = ++_lastIndex[agentId][msg.sender];

        // Add client to list if first feedback
        if (feedbackIndex == 1) {
            _clients[agentId].push(msg.sender);
        }

        _feedback[agentId][msg.sender][feedbackIndex] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false
        });

        emit NewFeedback(
            agentId,
            msg.sender,
            feedbackIndex,
            value,
            valueDecimals,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }

    /**
     * @notice Revoke previously given feedback
     * @param agentId The agent ID
     * @param feedbackIndex The feedback index to revoke
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        require(feedbackIndex > 0 && feedbackIndex <= _lastIndex[agentId][msg.sender], "Invalid index");
        require(!_feedback[agentId][msg.sender][feedbackIndex].isRevoked, "Already revoked");

        _feedback[agentId][msg.sender][feedbackIndex].isRevoked = true;

        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    /**
     * @notice Append a response to feedback
     * @param agentId The agent ID
     * @param clientAddress The client who gave feedback
     * @param feedbackIndex The feedback index
     * @param responseURI URI to response content
     * @param responseHash Hash of response content (optional for IPFS)
     */
    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        require(
            feedbackIndex > 0 && feedbackIndex <= _lastIndex[agentId][clientAddress],
            "Invalid index"
        );

        emit ResponseAppended(
            agentId,
            clientAddress,
            feedbackIndex,
            msg.sender,
            responseURI,
            responseHash
        );
    }

    /**
     * @notice Read a specific feedback entry
     * @param agentId The agent ID
     * @param clientAddress The client address
     * @param feedbackIndex The feedback index
     * @return value The feedback value
     * @return valueDecimals The decimals
     * @return tag1 First tag
     * @return tag2 Second tag
     * @return isRevoked Whether feedback is revoked
     */
    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    ) {
        Feedback memory fb = _feedback[agentId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    /**
     * @notice Get summary statistics for an agent
     * @param agentId The agent ID
     * @param clientAddresses Array of client addresses to include (required)
     * @param tag1 Filter by tag1 (empty string = no filter)
     * @param tag2 Filter by tag2 (empty string = no filter)
     * @return count Number of feedback entries
     * @return summaryValue Sum of all values
     * @return summaryValueDecimals Decimals for summary (max of all decimals)
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (
        uint64 count,
        int128 summaryValue,
        uint8 summaryValueDecimals
    ) {
        require(clientAddresses.length > 0, "Client addresses required");

        bool filterTag1 = bytes(tag1).length > 0;
        bool filterTag2 = bytes(tag2).length > 0;

        for (uint256 i = 0; i < clientAddresses.length; i++) {
            address client = clientAddresses[i];
            uint64 lastIdx = _lastIndex[agentId][client];

            for (uint64 idx = 1; idx <= lastIdx; idx++) {
                Feedback memory fb = _feedback[agentId][client][idx];
                
                if (fb.isRevoked) continue;
                
                if (filterTag1 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;

                count++;
                summaryValue += fb.value;
                
                if (fb.valueDecimals > summaryValueDecimals) {
                    summaryValueDecimals = fb.valueDecimals;
                }
            }
        }
    }

    /**
     * @notice Get all clients who have given feedback to an agent
     * @param agentId The agent ID
     * @return Array of client addresses
     */
    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }

    /**
     * @notice Get the last feedback index for a client
     * @param agentId The agent ID
     * @param clientAddress The client address
     * @return The last feedback index (0 if no feedback given)
     */
    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        return _lastIndex[agentId][clientAddress];
    }

    /**
     * @notice Read all feedback matching filters
     * @param agentId The agent ID
     * @param clientAddresses Array of clients (empty = all clients)
     * @param tag1 Filter by tag1 (empty = no filter)
     * @param tag2 Filter by tag2 (empty = no filter)
     * @param includeRevoked Whether to include revoked feedback
     */
    function readAllFeedback(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2,
        bool includeRevoked
    ) external view returns (
        address[] memory clients,
        uint64[] memory feedbackIndexes,
        int128[] memory values,
        uint8[] memory valueDecimals,
        string[] memory tag1s,
        string[] memory tag2s,
        bool[] memory revokedStatuses
    ) {
        // First pass: count matching feedback
        uint256 totalCount = 0;
        address[] memory clientList;
        if (clientAddresses.length > 0) {
            clientList = new address[](clientAddresses.length);
            for (uint256 i = 0; i < clientAddresses.length; i++) {
                clientList[i] = clientAddresses[i];
            }
        } else {
            clientList = _clients[agentId];
        }

        bool filterTag1 = bytes(tag1).length > 0;
        bool filterTag2 = bytes(tag2).length > 0;

        for (uint256 i = 0; i < clientList.length; i++) {
            address client = clientList[i];
            uint64 lastIdx = _lastIndex[agentId][client];

            for (uint64 idx = 1; idx <= lastIdx; idx++) {
                Feedback memory fb = _feedback[agentId][client][idx];
                
                if (!includeRevoked && fb.isRevoked) continue;
                if (filterTag1 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;

                totalCount++;
            }
        }

        // Initialize arrays
        clients = new address[](totalCount);
        feedbackIndexes = new uint64[](totalCount);
        values = new int128[](totalCount);
        valueDecimals = new uint8[](totalCount);
        tag1s = new string[](totalCount);
        tag2s = new string[](totalCount);
        revokedStatuses = new bool[](totalCount);

        // Second pass: populate arrays
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < clientList.length; i++) {
            address client = clientList[i];
            uint64 lastIdx = _lastIndex[agentId][client];

            for (uint64 idx = 1; idx <= lastIdx; idx++) {
                Feedback memory fb = _feedback[agentId][client][idx];
                
                if (!includeRevoked && fb.isRevoked) continue;
                if (filterTag1 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;

                clients[currentIndex] = client;
                feedbackIndexes[currentIndex] = idx;
                values[currentIndex] = fb.value;
                valueDecimals[currentIndex] = fb.valueDecimals;
                tag1s[currentIndex] = fb.tag1;
                tag2s[currentIndex] = fb.tag2;
                revokedStatuses[currentIndex] = fb.isRevoked;
                
                currentIndex++;
            }
        }
    }

    /**
     * @notice Check if agent exists in identity registry
     */
    function _isValidAgent(uint256 agentId) internal view returns (bool) {
        // Simple check - in production, verify against identity registry
        return agentId > 0;
    }

    /**
     * @notice Check if address is agent owner or operator
     */
    function _isAgentOwnerOrOperator(uint256 agentId, address addr) internal view returns (bool) {
        // Simplified - in production, check identity registry
        // This would call: identityRegistry.ownerOf(agentId) and check operators
        return false; // Placeholder
    }
}
