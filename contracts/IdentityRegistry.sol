// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title IdentityRegistry
 * @notice ERC-8004 Identity Registry - Manages agent identities as NFTs
 * @dev Each agent is represented as an ERC-721 token with URI storage
 */
contract IdentityRegistry is ERC721URIStorage {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Agent ID counter
    uint256 private _agentIdCounter;

    // Metadata storage: agentId => metadataKey => metadataValue
    mapping(uint256 => mapping(string => bytes)) private _metadata;

    // Agent wallet addresses (reserved metadata key)
    mapping(uint256 => address) private _agentWallets;

    // EIP-712 domain separator
    bytes32 private immutable _DOMAIN_SEPARATOR;
    bytes32 private constant _SET_WALLET_TYPEHASH = 
        keccak256("SetAgentWallet(uint256 agentId,address newWallet,uint256 deadline)");

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    // Events
    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );
    event AgentWalletSet(uint256 indexed agentId, address indexed newWallet);

    constructor() ERC721("ERC8004 Agent", "AGENT") {
        _agentIdCounter = 1; // Start from 1

        // Set up EIP-712 domain separator
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("IdentityRegistry")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Register a new agent with URI and metadata
     * @param agentURI URI pointing to agent registration file
     * @param metadata Array of metadata entries to set
     * @return agentId The ID of the newly registered agent
     */
    function register(
        string memory agentURI,
        MetadataEntry[] calldata metadata
    ) external returns (uint256 agentId) {
        agentId = _agentIdCounter++;
        _safeMint(msg.sender, agentId);
        
        if (bytes(agentURI).length > 0) {
            _setTokenURI(agentId, agentURI);
        }

        // Set agentWallet to owner by default
        _agentWallets[agentId] = msg.sender;
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(msg.sender));

        // Set additional metadata
        for (uint256 i = 0; i < metadata.length; i++) {
            require(
                keccak256(bytes(metadata[i].metadataKey)) != keccak256(bytes("agentWallet")),
                "Cannot set agentWallet via metadata"
            );
            _setMetadata(agentId, metadata[i].metadataKey, metadata[i].metadataValue);
        }

        emit Registered(agentId, agentURI, msg.sender);
    }

    /**
     * @notice Register a new agent without URI (set later)
     * @return agentId The ID of the newly registered agent
     */
    function register() external returns (uint256 agentId) {
        agentId = _agentIdCounter++;
        _safeMint(msg.sender, agentId);
        
        // Set agentWallet to owner by default
        _agentWallets[agentId] = msg.sender;
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(msg.sender));

        emit Registered(agentId, "", msg.sender);
    }

    /**
     * @notice Update agent URI
     * @param agentId The agent ID
     * @param newURI New URI for the agent registration file
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    /**
     * @notice Set metadata for an agent
     * @param agentId The agent ID
     * @param metadataKey The metadata key
     * @param metadataValue The metadata value
     */
    function setMetadata(
        uint256 agentId,
        string memory metadataKey,
        bytes memory metadataValue
    ) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        require(
            keccak256(bytes(metadataKey)) != keccak256(bytes("agentWallet")),
            "Use setAgentWallet for wallet"
        );
        _setMetadata(agentId, metadataKey, metadataValue);
    }

    /**
     * @notice Set agent wallet with signature verification
     * @param agentId The agent ID
     * @param newWallet The new wallet address
     * @param deadline Signature expiration timestamp
     * @param signature EIP-712 signature from newWallet
     */
    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        require(block.timestamp <= deadline, "Signature expired");
        require(newWallet != address(0), "Invalid wallet address");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(_SET_WALLET_TYPEHASH, agentId, newWallet, deadline)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, structHash));
        
        address signer = digest.recover(signature);
        require(signer == newWallet, "Invalid signature");

        _agentWallets[agentId] = newWallet;
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(newWallet));
        emit AgentWalletSet(agentId, newWallet);
    }

    /**
     * @notice Get agent wallet address
     * @param agentId The agent ID
     * @return The agent's wallet address
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    /**
     * @notice Unset agent wallet (resets to zero address)
     * @param agentId The agent ID
     */
    function unsetAgentWallet(uint256 agentId) external {
        require(_isAuthorized(ownerOf(agentId), msg.sender, agentId), "Not authorized");
        _agentWallets[agentId] = address(0);
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(address(0)));
    }

    /**
     * @notice Get metadata for an agent
     * @param agentId The agent ID
     * @param metadataKey The metadata key
     * @return The metadata value
     */
    function getMetadata(
        uint256 agentId,
        string memory metadataKey
    ) external view returns (bytes memory) {
        if (keccak256(bytes(metadataKey)) == keccak256(bytes("agentWallet"))) {
            return abi.encode(_agentWallets[agentId]);
        }
        return _metadata[agentId][metadataKey];
    }

    /**
     * @notice Internal function to set metadata
     */
    function _setMetadata(
        uint256 agentId,
        string memory metadataKey,
        bytes memory metadataValue
    ) internal {
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    /**
     * @notice Override transfer to clear agentWallet
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // Clear agentWallet on transfer
        if (from != address(0) && to != address(0)) {
            _agentWallets[tokenId] = address(0);
            emit MetadataSet(tokenId, "agentWallet", "agentWallet", abi.encode(address(0)));
        }
        
        return from;
    }

    /**
     * @notice Get the current agent ID counter
     * @return The next agent ID to be minted
     */
    function getNextAgentId() external view returns (uint256) {
        return _agentIdCounter;
    }
}
