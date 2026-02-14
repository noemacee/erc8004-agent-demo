// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ValidationRegistry
 * @notice ERC-8004 Validation Registry - Manages validation requests and responses
 * @dev Supports zkML, TEE, staking-based validation mechanisms
 */
contract ValidationRegistry {
    // Reference to Identity Registry
    address public identityRegistry;

    struct ValidationStatus {
        address validatorAddress;
        uint256 agentId;
        uint8 response; // 0-100 scale
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }

    // requestHash => ValidationStatus
    mapping(bytes32 => ValidationStatus) private _validations;

    // agentId => array of requestHashes
    mapping(uint256 => bytes32[]) private _agentValidations;

    // validatorAddress => array of requestHashes
    mapping(address => bytes32[]) private _validatorRequests;

    // Events
    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );

    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    /**
     * @notice Initialize the validation registry
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
     * @notice Request validation for agent work
     * @param validatorAddress The validator to use
     * @param agentId The agent being validated
     * @param requestURI URI containing validation request data
     * @param requestHash Commitment to request data (keccak256)
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        require(validatorAddress != address(0), "Invalid validator");
        require(requestHash != bytes32(0), "Invalid request hash");
        require(_isAgentOwnerOrOperator(agentId, msg.sender), "Not authorized");

        // Track this validation request
        if (_validations[requestHash].agentId == 0) {
            _validations[requestHash].validatorAddress = validatorAddress;
            _validations[requestHash].agentId = agentId;
            _agentValidations[agentId].push(requestHash);
            _validatorRequests[validatorAddress].push(requestHash);
        }

        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    /**
     * @notice Provide validation response
     * @param requestHash The request being validated
     * @param response Validation result (0-100)
     * @param responseURI URI to validation evidence (optional)
     * @param responseHash Hash of response content (optional)
     * @param tag Custom tag for categorization (optional)
     */
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationStatus storage status = _validations[requestHash];
        require(status.agentId != 0, "Invalid request");
        require(msg.sender == status.validatorAddress, "Not the validator");
        require(response <= 100, "Response must be 0-100");

        status.response = response;
        status.responseHash = responseHash;
        status.tag = tag;
        status.lastUpdate = block.timestamp;

        emit ValidationResponse(
            msg.sender,
            status.agentId,
            requestHash,
            response,
            responseURI,
            responseHash,
            tag
        );
    }

    /**
     * @notice Get validation status for a request
     * @param requestHash The request hash
     * @return validatorAddress The validator address
     * @return agentId The agent ID
     * @return response The validation response (0-100)
     * @return responseHash Hash of response content
     * @return tag Custom tag
     * @return lastUpdate Last update timestamp
     */
    function getValidationStatus(bytes32 requestHash) external view returns (
        address validatorAddress,
        uint256 agentId,
        uint8 response,
        bytes32 responseHash,
        string memory tag,
        uint256 lastUpdate
    ) {
        ValidationStatus memory status = _validations[requestHash];
        return (
            status.validatorAddress,
            status.agentId,
            status.response,
            status.responseHash,
            status.tag,
            status.lastUpdate
        );
    }

    /**
     * @notice Get summary statistics for agent validations
     * @param agentId The agent ID
     * @param validatorAddresses Filter by validators (empty = all)
     * @param tag Filter by tag (empty = no filter)
     * @return count Number of validations
     * @return averageResponse Average response score
     */
    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 averageResponse) {
        bytes32[] memory requestHashes = _agentValidations[agentId];
        bool filterValidators = validatorAddresses.length > 0;
        bool filterTag = bytes(tag).length > 0;
        
        uint256 totalResponse = 0;

        for (uint256 i = 0; i < requestHashes.length; i++) {
            ValidationStatus memory status = _validations[requestHashes[i]];
            
            // Skip if no response yet
            if (status.lastUpdate == 0) continue;

            // Apply filters
            if (filterValidators) {
                bool validatorMatch = false;
                for (uint256 j = 0; j < validatorAddresses.length; j++) {
                    if (status.validatorAddress == validatorAddresses[j]) {
                        validatorMatch = true;
                        break;
                    }
                }
                if (!validatorMatch) continue;
            }

            if (filterTag && keccak256(bytes(status.tag)) != keccak256(bytes(tag))) {
                continue;
            }

            count++;
            totalResponse += status.response;
        }

        if (count > 0) {
            averageResponse = uint8(totalResponse / count);
        }
    }

    /**
     * @notice Get all validation request hashes for an agent
     * @param agentId The agent ID
     * @return Array of request hashes
     */
    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    /**
     * @notice Get all validation requests for a validator
     * @param validatorAddress The validator address
     * @return Array of request hashes
     */
    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }

    /**
     * @notice Check if address is agent owner or operator
     * @dev In production, this would query the identity registry
     */
    function _isAgentOwnerOrOperator(uint256 agentId, address addr) internal view returns (bool) {
        // Simplified - in production, check identity registry
        // This would call: identityRegistry.ownerOf(agentId) and check operators
        return true; // Placeholder for demo
    }
}
