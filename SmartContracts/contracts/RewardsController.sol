// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LoyaltyToken.sol";

/**
 * @title RewardsController
 * @dev Manages coffee verification and BEAN token rewards distribution
 * 
 * Features:
 * - Verifies coffee purchases and distributes rewards
 * - Tracks user activity and merchant interactions
 * - Prevents double-spending and fraud
 * - Configurable reward amounts
 * - Integration with BEAN token contract
 */
contract RewardsController is AccessControl, Pausable, ReentrancyGuard {
    
    // Role definitions
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // BEAN token contract reference
    LoyaltyToken public immutable beanToken;
    
    // Reward configuration
    uint256 public constant COFFEE_REWARD_AMOUNT = 3 * 10**18; // 3 BEAN tokens
    uint256 public constant DAILY_CLAIM_LIMIT = 10; // Max 10 coffee rewards per user per day
    uint256 public constant COOLDOWN_PERIOD = 30 minutes; // 30 minutes between claims at same location
    
    // Tracking structures
    struct CoffeeReward {
        address user;
        address merchant;
        string locationId;
        uint256 rewardAmount;
        uint256 timestamp;
        bool isValid;
    }
    
    struct UserStats {
        uint256 totalRewards;
        uint256 totalCoffees;
        uint256 lastClaimDay;
        uint256 dailyClaimCount;
        mapping(string => uint256) lastClaimAtLocation;
    }
    
    struct MerchantStats {
        address merchantWallet;
        string locationId;
        string name;
        uint256 totalRewards;
        uint256 totalCustomers;
        bool isVerified;
        bool isActive;
    }
    
    // Storage mappings
    mapping(address => UserStats) public userStats;
    mapping(string => MerchantStats) public merchantsByLocation;
    mapping(address => string[]) public merchantLocations;
    mapping(bytes32 => CoffeeReward) public coffeeRewards;
    mapping(bytes32 => bool) public processedRewards;
    
    // Counters
    uint256 public totalRewardsDistributed;
    uint256 public totalCoffeesVerified;
    uint256 public totalActiveMerchants;
    
    // Events
    event CoffeeVerified(
        bytes32 indexed rewardId,
        address indexed user,
        address indexed merchant,
        string locationId,
        uint256 rewardAmount,
        uint256 timestamp
    );
    
    event RewardDistributed(
        address indexed user,
        uint256 amount,
        string locationId,
        bytes32 rewardId
    );
    
    event MerchantRegistered(
        address indexed merchant,
        string locationId,
        string name
    );
    
    event MerchantStatusUpdated(
        address indexed merchant,
        string locationId,
        bool isVerified,
        bool isActive
    );
    
    event RewardConfigUpdated(
        uint256 oldAmount,
        uint256 newAmount
    );
    
    event FraudDetected(
        address indexed user,
        string locationId,
        string reason,
        bytes32 rewardId
    );
    
    constructor(
        address _beanTokenAddress,
        address _admin
    ) {
        require(_beanTokenAddress != address(0), "Bean token address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");
        
        beanToken = LoyaltyToken(_beanTokenAddress);
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(VERIFIER_ROLE, _admin);
    }
    
    /**
     * @dev Register a new merchant location
     * @param merchant Merchant wallet address
     * @param locationId Unique location identifier
     * @param name Merchant/location name
     */
    function registerMerchant(
        address merchant,
        string calldata locationId,
        string calldata name
    ) external onlyRole(ADMIN_ROLE) {
        require(merchant != address(0), "Merchant address cannot be zero");
        require(bytes(locationId).length > 0, "Location ID required");
        require(bytes(name).length > 0, "Merchant name required");
        require(!merchantsByLocation[locationId].isActive, "Location already registered");
        
        // Register merchant
        merchantsByLocation[locationId] = MerchantStats({
            merchantWallet: merchant,
            locationId: locationId,
            name: name,
            totalRewards: 0,
            totalCustomers: 0,
            isVerified: true, // Auto-verify for MVP
            isActive: true
        });
        
        // Track merchant locations
        merchantLocations[merchant].push(locationId);
        totalActiveMerchants++;
        
        emit MerchantRegistered(merchant, locationId, name);
    }
    
    /**
     * @dev Verify coffee purchase and distribute BEAN rewards
     * @param user User wallet address
     * @param locationId Location where coffee was purchased
     * @param imageHash Hash of uploaded coffee image (for verification)
     * @param timestamp Timestamp of coffee purchase
     */
    function verifyCoffeeAndReward(
        address user,
        string calldata locationId,
        bytes32 imageHash,
        uint256 timestamp
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused nonReentrant {
        require(user != address(0), "User address cannot be zero");
        require(bytes(locationId).length > 0, "Location ID required");
        require(imageHash != bytes32(0), "Image hash required");
        require(timestamp <= block.timestamp, "Invalid timestamp");
        require(timestamp > block.timestamp - 1 hours, "Timestamp too old");
        
        // Check if merchant location exists and is active
        MerchantStats storage merchant = merchantsByLocation[locationId];
        require(merchant.isActive, "Merchant location not active");
        require(merchant.isVerified, "Merchant location not verified");
        
        // Generate unique reward ID
        bytes32 rewardId = keccak256(abi.encodePacked(
            user,
            locationId,
            imageHash,
            timestamp,
            block.timestamp
        ));
        
        // Prevent duplicate processing
        require(!processedRewards[rewardId], "Reward already processed");
        
        // Fraud prevention checks
        _performFraudChecks(user, locationId, rewardId);
        
        // Update daily claim limits
        _updateDailyClaims(user);
        
        // Create coffee reward record
        coffeeRewards[rewardId] = CoffeeReward({
            user: user,
            merchant: merchant.merchantWallet,
            locationId: locationId,
            rewardAmount: COFFEE_REWARD_AMOUNT,
            timestamp: block.timestamp,
            isValid: true
        });
        
        // Mark as processed
        processedRewards[rewardId] = true;
        
        // Update statistics
        _updateStatistics(user, locationId);
        
        // Distribute BEAN rewards
        _distributeRewards(user, rewardId);
        
        emit CoffeeVerified(
            rewardId,
            user,
            merchant.merchantWallet,
            locationId,
            COFFEE_REWARD_AMOUNT,
            block.timestamp
        );
    }
    
    /**
     * @dev Perform fraud prevention checks
     */
    function _performFraudChecks(
        address user,
        string memory locationId,
        bytes32 rewardId
    ) internal {
        UserStats storage stats = userStats[user];
        
        // Check daily claim limits
        uint256 currentDay = block.timestamp / 1 days;
        if (stats.lastClaimDay == currentDay) {
            require(stats.dailyClaimCount < DAILY_CLAIM_LIMIT, "Daily claim limit exceeded");
        }
        
        // Check cooldown period for same location
        uint256 lastClaim = stats.lastClaimAtLocation[locationId];
        if (lastClaim > 0) {
            require(
                block.timestamp >= lastClaim + COOLDOWN_PERIOD,
                "Cooldown period not met for this location"
            );
        }
        
        // Additional fraud checks can be added here
        // For example: checking if user is at the actual location (future feature)
    }
    
    /**
     * @dev Update daily claim tracking
     */
    function _updateDailyClaims(address user) internal {
        UserStats storage stats = userStats[user];
        uint256 currentDay = block.timestamp / 1 days;
        
        if (stats.lastClaimDay < currentDay) {
            // New day, reset counter
            stats.lastClaimDay = currentDay;
            stats.dailyClaimCount = 1;
        } else {
            // Same day, increment counter
            stats.dailyClaimCount++;
        }
    }
    
    /**
     * @dev Update user and merchant statistics
     */
    function _updateStatistics(address user, string memory locationId) internal {
        UserStats storage userStat = userStats[user];
        MerchantStats storage merchant = merchantsByLocation[locationId];
        
        // Update user stats
        userStat.totalRewards += COFFEE_REWARD_AMOUNT;
        userStat.totalCoffees++;
        userStat.lastClaimAtLocation[locationId] = block.timestamp;
        
        // Update merchant stats
        merchant.totalRewards += COFFEE_REWARD_AMOUNT;
        merchant.totalCustomers++;
        
        // Update global stats
        totalRewardsDistributed += COFFEE_REWARD_AMOUNT;
        totalCoffeesVerified++;
    }
    
    /**
     * @dev Distribute BEAN token rewards to user
     */
    function _distributeRewards(address user, bytes32 rewardId) internal {
        // Mint BEAN tokens to user
        try beanToken.mint(
            user,
            COFFEE_REWARD_AMOUNT,
            "Coffee purchase reward"
        ) {
            emit RewardDistributed(
                user,
                COFFEE_REWARD_AMOUNT,
                coffeeRewards[rewardId].locationId,
                rewardId
            );
        } catch (bytes memory reason) {
            // Handle minting failure
            coffeeRewards[rewardId].isValid = false;
            revert(string(abi.encodePacked("Reward distribution failed: ", reason)));
        }
    }
    
    /**
     * @dev Get user statistics
     * @param user User address
     * @return totalRewards Total BEAN rewards earned
     * @return totalCoffees Total coffees verified
     * @return dailyClaimCount Claims made today
     * @return canClaimMore Whether user can claim more today
     */
    function getUserStats(address user) external view returns (
        uint256 totalRewards,
        uint256 totalCoffees,
        uint256 dailyClaimCount,
        bool canClaimMore
    ) {
        UserStats storage stats = userStats[user];
        uint256 currentDay = block.timestamp / 1 days;
        
        uint256 todaysClaims = 0;
        if (stats.lastClaimDay == currentDay) {
            todaysClaims = stats.dailyClaimCount;
        }
        
        return (
            stats.totalRewards,
            stats.totalCoffees,
            todaysClaims,
            todaysClaims < DAILY_CLAIM_LIMIT
        );
    }
    
    /**
     * @dev Get merchant statistics
     * @param locationId Location identifier
     * @return merchant Merchant wallet address
     * @return name Merchant name
     * @return totalRewards Total rewards distributed
     * @return totalCustomers Total unique customers
     * @return isActive Whether merchant is active
     */
    function getMerchantStats(string calldata locationId) external view returns (
        address merchant,
        string memory name,
        uint256 totalRewards,
        uint256 totalCustomers,
        bool isActive
    ) {
        MerchantStats storage stats = merchantsByLocation[locationId];
        return (
            stats.merchantWallet,
            stats.name,
            stats.totalRewards,
            stats.totalCustomers,
            stats.isActive
        );
    }
    
    /**
     * @dev Check if user can claim reward at location
     * @param user User address
     * @param locationId Location identifier
     * @return canClaim Whether user can claim
     * @return timeUntilNext Time until next claim allowed
     */
    function canUserClaimAt(address user, string calldata locationId) external view returns (
        bool canClaim,
        uint256 timeUntilNext
    ) {
        UserStats storage stats = userStats[user];
        
        // Check daily limit
        uint256 currentDay = block.timestamp / 1 days;
        if (stats.lastClaimDay == currentDay && stats.dailyClaimCount >= DAILY_CLAIM_LIMIT) {
            return (false, 0);
        }
        
        // Check location cooldown
        uint256 lastClaim = stats.lastClaimAtLocation[locationId];
        if (lastClaim > 0) {
            uint256 nextAllowedTime = lastClaim + COOLDOWN_PERIOD;
            if (block.timestamp < nextAllowedTime) {
                return (false, nextAllowedTime - block.timestamp);
            }
        }
        
        return (true, 0);
    }
    
    /**
     * @dev Get reward details
     * @param rewardId Reward identifier
     * @return reward Reward details
     */
    function getRewardDetails(bytes32 rewardId) external view returns (CoffeeReward memory reward) {
        return coffeeRewards[rewardId];
    }
    
    /**
     * @dev Update merchant status (admin only)
     * @param locationId Location identifier
     * @param isVerified Whether merchant is verified
     * @param isActive Whether merchant is active
     */
    function updateMerchantStatus(
        string calldata locationId,
        bool isVerified,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        MerchantStats storage merchant = merchantsByLocation[locationId];
        require(bytes(merchant.locationId).length > 0, "Merchant not found");
        
        bool wasActive = merchant.isActive;
        merchant.isVerified = isVerified;
        merchant.isActive = isActive;
        
        // Update active merchant count
        if (wasActive && !isActive) {
            totalActiveMerchants--;
        } else if (!wasActive && isActive) {
            totalActiveMerchants++;
        }
        
        emit MerchantStatusUpdated(
            merchant.merchantWallet,
            locationId,
            isVerified,
            isActive
        );
    }
    
    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Add verifier role (admin only)
     * @param verifier Address to grant verifier role
     */
    function addVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        require(verifier != address(0), "Verifier cannot be zero address");
        _grantRole(VERIFIER_ROLE, verifier);
    }
    
    /**
     * @dev Remove verifier role (admin only)
     * @param verifier Address to revoke verifier role
     */
    function removeVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, verifier);
    }
    
    /**
     * @dev Get contract statistics
     * @return totalRewards Total rewards distributed
     * @return totalCoffees Total coffees verified
     * @return activeMerchants Number of active merchants
     * @return tokenAddress BEAN token contract address
     */
    function getContractStats() external view returns (
        uint256 totalRewards,
        uint256 totalCoffees,
        uint256 activeMerchants,
        address tokenAddress
    ) {
        return (
            totalRewardsDistributed,
            totalCoffeesVerified,
            totalActiveMerchants,
            address(beanToken)
        );
    }
}