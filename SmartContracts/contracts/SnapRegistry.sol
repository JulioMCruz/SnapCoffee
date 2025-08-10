// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SnapRegistry
 * @dev Registry contract for Snap Coffee platform events and state management
 * 
 * Features:
 * - Event logging for coffee snaps, rewards, and redemptions
 * - User statistics tracking
 * - Venue analytics
 * - Milestone progress tracking
 * - Fraud prevention and duplicate detection
 */
contract SnapRegistry is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ANALYTICS_ROLE = keccak256("ANALYTICS_ROLE");
    
    // Snap data structure
    struct CoffeeSnap {
        address user;           // User who submitted the snap
        uint256 fid;           // Farcaster ID
        string imageHash;       // IPFS/content hash of image
        string venueId;        // Hashed venue identifier
        uint256 timestamp;     // When snap was submitted
        bool validated;        // Whether snap passed validation
        uint256 rewardAmount;  // $BEAN tokens rewarded
        bool fraudulent;       // Marked as fraudulent
    }
    
    // User statistics structure
    struct UserStats {
        uint256 totalSnaps;        // Total snaps submitted
        uint256 validatedSnaps;    // Successfully validated snaps
        uint256 totalRewards;      // Total $BEAN earned
        uint256 couponsEarned;     // Total NFT coupons earned
        uint256 lastSnapTimestamp; // Last snap timestamp
        uint256 consecutiveDays;   // Consecutive days with snaps
        bool isBlacklisted;        // Anti-fraud blacklist
    }
    
    // Venue statistics structure
    struct VenueStats {
        string name;              // Venue name
        uint256 totalSnaps;       // Total snaps at venue
        uint256 uniqueVisitors;   // Unique users who snapped
        uint256 totalRewards;     // Total rewards distributed
        mapping(address => bool) hasVisited; // User visit tracking
        bool isVerified;          // Verified venue
    }
    
    // Storage
    mapping(uint256 => CoffeeSnap) public snaps;           // Snap ID => snap data
    mapping(address => UserStats) public userStats;        // User => stats
    mapping(string => VenueStats) public venueStats;       // Venue ID => stats
    mapping(address => uint256[]) public userSnaps;        // User => snap IDs
    mapping(string => uint256[]) public venueSnaps;        // Venue => snap IDs
    mapping(string => bool) public usedImageHashes;        // Duplicate detection
    
    uint256 private _snapCounter;                          // Snap ID counter
    
    // Constants
    uint256 public constant SNAP_COOLDOWN = 1 hours;      // Min time between snaps
    uint256 public constant DAILY_SNAP_LIMIT = 10;        // Max snaps per day
    uint256 public constant FRAUD_THRESHOLD = 3;          // Fraud reports before blacklist
    
    // Events
    event SnapRecorded(
        uint256 indexed snapId,
        address indexed user,
        uint256 indexed fid,
        string venueId,
        bool validated,
        uint256 rewardAmount
    );
    
    event RewardDistributed(
        address indexed user,
        uint256 amount,
        string reason,
        uint256 snapId
    );
    
    event CouponEarned(
        address indexed user,
        uint256 indexed tokenId,
        uint256 totalSnaps
    );
    
    event UserBlacklisted(
        address indexed user,
        string reason
    );
    
    event VenueVerified(
        string indexed venueId,
        string name
    );
    
    event FraudReported(
        uint256 indexed snapId,
        address indexed reporter,
        string reason
    );
    
    constructor(address admin) {
        require(admin != address(0), "Admin cannot be zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(ANALYTICS_ROLE, admin);
        
        _snapCounter = 1; // Start snap IDs at 1
    }
    
    /**
     * @dev Record a new coffee snap
     * @param user User address
     * @param fid Farcaster ID
     * @param imageHash Content hash of the image
     * @param venueId Hashed venue identifier
     * @param validated Whether snap passed validation
     * @param rewardAmount $BEAN tokens to reward
     * @return snapId The recorded snap ID
     */
    function recordSnap(
        address user,
        uint256 fid,
        string calldata imageHash,
        string calldata venueId,
        bool validated,
        uint256 rewardAmount
    ) external onlyRole(RECORDER_ROLE) whenNotPaused nonReentrant returns (uint256 snapId) {
        require(user != address(0), "Invalid user address");
        require(bytes(imageHash).length > 0, "Image hash required");
        require(bytes(venueId).length > 0, "Venue ID required");
        require(!userStats[user].isBlacklisted, "User is blacklisted");
        
        // Anti-fraud checks
        require(!usedImageHashes[imageHash], "Duplicate image detected");
        require(
            block.timestamp >= userStats[user].lastSnapTimestamp + SNAP_COOLDOWN,
            "Snap cooldown active"
        );
        require(
            _getUserSnapsToday(user) < DAILY_SNAP_LIMIT,
            "Daily snap limit exceeded"
        );
        
        snapId = _snapCounter;
        _snapCounter++;
        
        // Record snap
        snaps[snapId] = CoffeeSnap({
            user: user,
            fid: fid,
            imageHash: imageHash,
            venueId: venueId,
            timestamp: block.timestamp,
            validated: validated,
            rewardAmount: rewardAmount,
            fraudulent: false
        });
        
        // Update user stats
        UserStats storage stats = userStats[user];
        stats.totalSnaps++;
        if (validated) {
            stats.validatedSnaps++;
            stats.totalRewards += rewardAmount;
        }
        stats.lastSnapTimestamp = block.timestamp;
        
        // Update consecutive days (simplified)
        if (block.timestamp - stats.lastSnapTimestamp <= 2 days) {
            stats.consecutiveDays++;
        } else {
            stats.consecutiveDays = 1;
        }
        
        // Update venue stats
        VenueStats storage venue = venueStats[venueId];
        venue.totalSnaps++;
        if (!venue.hasVisited[user]) {
            venue.uniqueVisitors++;
            venue.hasVisited[user] = true;
        }
        if (validated) {
            venue.totalRewards += rewardAmount;
        }
        
        // Track relationships
        userSnaps[user].push(snapId);
        venueSnaps[venueId].push(snapId);
        usedImageHashes[imageHash] = true;
        
        emit SnapRecorded(snapId, user, fid, venueId, validated, rewardAmount);
        
        if (validated && rewardAmount > 0) {
            emit RewardDistributed(user, rewardAmount, "Coffee snap reward", snapId);
        }
        
        return snapId;
    }
    
    /**
     * @dev Record coupon earned by user
     * @param user User address
     * @param tokenId NFT token ID
     */
    function recordCouponEarned(
        address user,
        uint256 tokenId
    ) external onlyRole(RECORDER_ROLE) whenNotPaused {
        require(user != address(0), "Invalid user address");
        
        userStats[user].couponsEarned++;
        
        emit CouponEarned(user, tokenId, userStats[user].validatedSnaps);
    }
    
    /**
     * @dev Report fraudulent snap
     * @param snapId Snap ID to report
     * @param reason Reason for fraud report
     */
    function reportFraud(
        uint256 snapId,
        string calldata reason
    ) external onlyRole(ANALYTICS_ROLE) {
        require(snapId < _snapCounter, "Invalid snap ID");
        
        CoffeeSnap storage snap = snaps[snapId];
        require(!snap.fraudulent, "Already marked as fraudulent");
        
        snap.fraudulent = true;
        
        // Update user stats (remove rewards if fraudulent)
        UserStats storage stats = userStats[snap.user];
        if (snap.validated) {
            stats.validatedSnaps--;
            stats.totalRewards -= snap.rewardAmount;
        }
        
        emit FraudReported(snapId, msg.sender, reason);
        
        // Check if user should be blacklisted
        uint256 fraudCount = _getUserFraudCount(snap.user);
        if (fraudCount >= FRAUD_THRESHOLD) {
            stats.isBlacklisted = true;
            emit UserBlacklisted(snap.user, "Multiple fraud reports");
        }
    }
    
    /**
     * @dev Verify a venue
     * @param venueId Venue ID
     * @param name Venue name
     */
    function verifyVenue(
        string calldata venueId,
        string calldata name
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(venueId).length > 0, "Invalid venue ID");
        require(bytes(name).length > 0, "Invalid venue name");
        
        VenueStats storage venue = venueStats[venueId];
        venue.name = name;
        venue.isVerified = true;
        
        emit VenueVerified(venueId, name);
    }
    
    /**
     * @dev Get user's snap count for today
     * @param user User address
     * @return count Number of snaps today
     */
    function _getUserSnapsToday(address user) private view returns (uint256 count) {
        uint256[] memory userSnapIds = userSnaps[user];
        uint256 todayStart = (block.timestamp / 1 days) * 1 days;
        
        for (uint256 i = 0; i < userSnapIds.length; i++) {
            if (snaps[userSnapIds[i]].timestamp >= todayStart) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Get user's fraud count
     * @param user User address
     * @return count Number of fraudulent snaps
     */
    function _getUserFraudCount(address user) private view returns (uint256 count) {
        uint256[] memory userSnapIds = userSnaps[user];
        
        for (uint256 i = 0; i < userSnapIds.length; i++) {
            if (snaps[userSnapIds[i]].fraudulent) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Get user's milestone progress
     * @param user User address
     * @return validatedSnaps Number of validated snaps
     * @return totalRewards Total rewards earned
     * @return couponsEarned Number of coupons earned
     * @return consecutiveDays Consecutive days
     * @return nextCouponEligible Whether eligible for next coupon
     */
    function getUserMilestoneProgress(address user) external view returns (
        uint256 validatedSnaps,
        uint256 totalRewards,
        uint256 couponsEarned,
        uint256 consecutiveDays,
        bool nextCouponEligible
    ) {
        UserStats memory stats = userStats[user];
        
        return (
            stats.validatedSnaps,
            stats.totalRewards,
            stats.couponsEarned,
            stats.consecutiveDays,
            stats.validatedSnaps > 0 && stats.validatedSnaps % 10 == 0 // Every 10 snaps
        );
    }
    
    /**
     * @dev Get venue analytics
     * @param venueId Venue ID
     * @return name Venue name
     * @return totalSnaps Total snaps at venue
     * @return uniqueVisitors Unique visitors count
     * @return totalRewards Total rewards distributed
     * @return isVerified Whether venue is verified
     */
    function getVenueAnalytics(string calldata venueId) external view returns (
        string memory name,
        uint256 totalSnaps,
        uint256 uniqueVisitors,
        uint256 totalRewards,
        bool isVerified
    ) {
        VenueStats storage venue = venueStats[venueId];
        
        return (
            venue.name,
            venue.totalSnaps,
            venue.uniqueVisitors,
            venue.totalRewards,
            venue.isVerified
        );
    }
    
    /**
     * @dev Get user's recent snaps
     * @param user User address
     * @param limit Maximum number of snaps to return
     * @return snapIds Array of recent snap IDs
     */
    function getUserRecentSnaps(address user, uint256 limit) external view returns (uint256[] memory snapIds) {
        uint256[] memory allSnaps = userSnaps[user];
        uint256 length = allSnaps.length;
        
        if (length == 0) {
            return new uint256[](0);
        }
        
        uint256 returnLength = length > limit ? limit : length;
        snapIds = new uint256[](returnLength);
        
        // Return most recent snaps (from end of array)
        for (uint256 i = 0; i < returnLength; i++) {
            snapIds[i] = allSnaps[length - 1 - i];
        }
        
        return snapIds;
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
     * @dev Get current snap counter
     */
    function getCurrentSnapId() external view returns (uint256) {
        return _snapCounter;
    }
    
    /**
     * @dev Get contract stats
     */
    function getContractStats() external view returns (
        uint256 totalSnaps,
        uint256 totalUsers,
        uint256 totalVenues
    ) {
        // Note: totalUsers and totalVenues would require additional tracking
        // For now, return snap count only
        return (_snapCounter - 1, 0, 0);
    }
}