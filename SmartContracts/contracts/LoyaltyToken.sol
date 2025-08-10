// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LoyaltyToken
 * @dev $BEAN - Coffee loyalty reward token for Snap Coffee platform
 * 
 * Features:
 * - ERC20 standard with 18 decimals
 * - Mintable by authorized minters (CDP server wallet)
 * - Burnable by token holders
 * - Pausable for emergency situations
 * - Permit functionality for gasless transactions
 * - Access control for different roles
 */
contract LoyaltyToken is 
    ERC20, 
    ERC20Permit, 
    ERC20Burnable, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard 
{
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Token configuration
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion $BEAN max supply
    uint256 public constant MINT_CAP_PER_TX = 10_000 * 10**18;   // 10,000 $BEAN per transaction
    
    // Minting tracking
    mapping(address => uint256) public dailyMinted;
    mapping(address => uint256) public lastMintDay;
    uint256 public constant DAILY_MINT_LIMIT = 100_000 * 10**18; // 100,000 $BEAN per minter per day
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor(
        address admin,
        address cdpWallet
    ) ERC20("Snap Coffee Bean", "BEAN") ERC20Permit("Snap Coffee Bean") {
        require(admin != address(0), "Admin cannot be zero address");
        require(cdpWallet != address(0), "CDP wallet cannot be zero address");
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, cdpWallet);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        
        // Initial mint to admin for testing/liquidity
        _mint(admin, 1_000_000 * 10**18); // 1M $BEAN
        
        emit TokensMinted(admin, 1_000_000 * 10**18, "Initial supply");
    }
    
    /**
     * @dev Mint tokens to specified address
     * @param to Recipient address
     * @param amount Amount to mint (in wei)
     * @param reason Reason for minting (for tracking)
     */
    function mint(
        address to, 
        uint256 amount, 
        string calldata reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= MINT_CAP_PER_TX, "Amount exceeds per-transaction cap");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        // Check daily minting limits
        uint256 currentDay = block.timestamp / 1 days;
        if (lastMintDay[msg.sender] < currentDay) {
            dailyMinted[msg.sender] = 0;
            lastMintDay[msg.sender] = currentDay;
        }
        
        require(
            dailyMinted[msg.sender] + amount <= DAILY_MINT_LIMIT,
            "Daily mint limit exceeded"
        );
        
        dailyMinted[msg.sender] += amount;
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     * @param reason Reason for batch minting
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 100, "Too many recipients"); // Gas limit protection
        
        uint256 totalAmount = 0;
        
        // Calculate total and validate
        for (uint256 i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Would exceed max supply");
        
        // Check daily limits
        uint256 currentDay = block.timestamp / 1 days;
        if (lastMintDay[msg.sender] < currentDay) {
            dailyMinted[msg.sender] = 0;
            lastMintDay[msg.sender] = currentDay;
        }
        
        require(
            dailyMinted[msg.sender] + totalAmount <= DAILY_MINT_LIMIT,
            "Daily mint limit exceeded"
        );
        
        dailyMinted[msg.sender] += totalAmount;
        
        // Execute mints
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i], reason);
        }
    }
    
    /**
     * @dev Burn tokens from specified address (with approval)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(
        address from, 
        uint256 amount
    ) public override onlyRole(BURNER_ROLE) whenNotPaused {
        super.burnFrom(from, amount);
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Burn own tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public override whenNotPaused {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Add minter role to address
     * @param minter Address to grant minter role
     */
    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minter != address(0), "Minter cannot be zero address");
        _grantRole(MINTER_ROLE, minter);
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove minter role from address
     * @param minter Address to revoke minter role
     */
    function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Get remaining daily mint allowance for minter
     * @param minter Minter address
     * @return remaining Remaining daily mint allowance
     */
    function getRemainingDailyMint(address minter) external view returns (uint256 remaining) {
        uint256 currentDay = block.timestamp / 1 days;
        
        if (lastMintDay[minter] < currentDay) {
            return DAILY_MINT_LIMIT;
        }
        
        return DAILY_MINT_LIMIT - dailyMinted[minter];
    }
    
    /**
     * @dev Check if address has minter role
     * @param account Address to check
     * @return hasMinterRole True if address has minter role
     */
    function isMinter(address account) external view returns (bool hasMinterRole) {
        return hasRole(MINTER_ROLE, account);
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    /**
     * @dev Get contract information
     * @return info Contract information struct
     */
    function getContractInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 maxSupply_,
        bool isPaused_
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            paused()
        );
    }
}