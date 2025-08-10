// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CouponNFT
 * @dev Coffee coupon NFTs for Snap Coffee platform
 * 
 * Features:
 * - ERC721 standard NFTs
 * - Mintable by authorized minters
 * - Redeemable system with on-chain validation
 * - URI storage for metadata
 * - Pausable for emergency situations
 * - Burnable after redemption
 */
contract CouponNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Burnable, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard 
{
    using Strings for uint256;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Coupon configuration
    uint256 public constant MAX_SUPPLY = 10_000_000; // 10 million coupons max
    uint256 private _tokenIdCounter;
    
    // Coupon metadata structure
    struct CouponMetadata {
        uint256 coffeeShopsEarned; // Number of coffee shops user visited to earn this
        uint256 discountPercent;   // Discount percentage (e.g., 20 for 20%)
        uint256 expiryTimestamp;   // Expiration timestamp
        string venueId;           // Associated venue ID (optional)
        bool isRedeemed;          // Redemption status
        uint256 redeemedAt;       // Redemption timestamp
        address redeemedBy;       // Who redeemed it
    }
    
    // Storage
    mapping(uint256 => CouponMetadata) public couponData;
    mapping(address => uint256[]) public userCoupons;
    mapping(string => uint256[]) public venueCoupons;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Events
    event CouponMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 coffeeShopsEarned,
        uint256 discountPercent,
        uint256 expiryTimestamp,
        string venueId
    );
    
    event CouponRedeemed(
        uint256 indexed tokenId,
        address indexed redeemedBy,
        string venueId,
        uint256 timestamp
    );
    
    event CouponExpired(uint256 indexed tokenId);
    
    event BaseURIUpdated(string oldURI, string newURI);
    
    constructor(
        address admin,
        address cdpWallet,
        string memory baseURI
    ) ERC721("Snap Coffee Coupon", "SCOUPON") {
        require(admin != address(0), "Admin cannot be zero address");
        require(cdpWallet != address(0), "CDP wallet cannot be zero address");
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, cdpWallet);
        _grantRole(REDEEMER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        
        _baseTokenURI = baseURI;
        _tokenIdCounter = 1; // Start token IDs at 1
    }
    
    /**
     * @dev Mint a new coupon NFT
     * @param to Recipient address
     * @param coffeeShopsEarned Number of coffee shops visited to earn this
     * @param discountPercent Discount percentage (1-100)
     * @param expiryDays Days until expiration
     * @param venueId Associated venue ID (empty string if general)
     * @return tokenId The minted token ID
     */
    function mintCoupon(
        address to,
        uint256 coffeeShopsEarned,
        uint256 discountPercent,
        uint256 expiryDays,
        string calldata venueId
    ) public onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256 tokenId) {
        require(to != address(0), "Cannot mint to zero address");
        require(discountPercent > 0 && discountPercent <= 100, "Invalid discount percentage");
        require(expiryDays > 0 && expiryDays <= 365, "Invalid expiry days");
        require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
        
        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Calculate expiry timestamp
        uint256 expiryTimestamp = block.timestamp + (expiryDays * 1 days);
        
        // Store coupon metadata
        couponData[tokenId] = CouponMetadata({
            coffeeShopsEarned: coffeeShopsEarned,
            discountPercent: discountPercent,
            expiryTimestamp: expiryTimestamp,
            venueId: venueId,
            isRedeemed: false,
            redeemedAt: 0,
            redeemedBy: address(0)
        });
        
        // Mint NFT
        _safeMint(to, tokenId);
        
        // Track user and venue coupons
        userCoupons[to].push(tokenId);
        if (bytes(venueId).length > 0) {
            venueCoupons[venueId].push(tokenId);
        }
        
        emit CouponMinted(
            to,
            tokenId,
            coffeeShopsEarned,
            discountPercent,
            expiryTimestamp,
            venueId
        );
        
        return tokenId;
    }
    
    /**
     * @dev Batch mint coupons for milestone rewards
     * @param recipients Array of recipient addresses
     * @param coffeeShopsEarned Number of coffee shops earned for each recipient
     * @param discountPercent Discount percentage for all coupons
     * @param expiryDays Days until expiration for all coupons
     * @param venueId Associated venue ID (empty for general coupons)
     * @return tokenIds Array of minted token IDs
     */
    function batchMintCoupons(
        address[] calldata recipients,
        uint256 coffeeShopsEarned,
        uint256 discountPercent,
        uint256 expiryDays,
        string calldata venueId
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256[] memory tokenIds) {
        require(recipients.length > 0 && recipients.length <= 100, "Invalid recipients array");
        require(_tokenIdCounter + recipients.length <= MAX_SUPPLY, "Would exceed max supply");
        
        tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintCoupon(
                recipients[i],
                coffeeShopsEarned,
                discountPercent,
                expiryDays,
                venueId
            );
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Redeem a coupon NFT
     * @param tokenId Token ID to redeem
     * @param venueId Venue where coupon is being redeemed
     */
    function redeemCoupon(
        uint256 tokenId,
        string calldata venueId
    ) external onlyRole(REDEEMER_ROLE) whenNotPaused nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Coupon does not exist");
        
        CouponMetadata storage coupon = couponData[tokenId];
        require(!coupon.isRedeemed, "Coupon already redeemed");
        require(block.timestamp <= coupon.expiryTimestamp, "Coupon expired");
        
        // Check venue restriction if applicable
        if (bytes(coupon.venueId).length > 0) {
            require(
                keccak256(bytes(coupon.venueId)) == keccak256(bytes(venueId)),
                "Coupon can only be redeemed at specific venue"
            );
        }
        
        // Mark as redeemed
        coupon.isRedeemed = true;
        coupon.redeemedAt = block.timestamp;
        coupon.redeemedBy = msg.sender;
        
        emit CouponRedeemed(tokenId, msg.sender, venueId, block.timestamp);
        
        // Optionally burn the NFT after redemption
        // _burn(tokenId);
    }
    
    /**
     * @dev Check if coupon is valid for redemption
     * @param tokenId Token ID to check
     * @return isValid Whether coupon can be redeemed
     * @return reason Reason if not valid
     */
    function isValidForRedemption(uint256 tokenId) external view returns (bool isValid, string memory reason) {
        if (_ownerOf(tokenId) == address(0)) {
            return (false, "Coupon does not exist");
        }
        
        CouponMetadata memory coupon = couponData[tokenId];
        
        if (coupon.isRedeemed) {
            return (false, "Coupon already redeemed");
        }
        
        if (block.timestamp > coupon.expiryTimestamp) {
            return (false, "Coupon expired");
        }
        
        return (true, "");
    }
    
    /**
     * @dev Get user's coupons
     * @param user User address
     * @return tokenIds Array of token IDs owned by user
     */
    function getUserCoupons(address user) external view returns (uint256[] memory tokenIds) {
        return userCoupons[user];
    }
    
    /**
     * @dev Get venue-specific coupons
     * @param venueId Venue ID
     * @return tokenIds Array of token IDs for venue
     */
    function getVenueCoupons(string calldata venueId) external view returns (uint256[] memory tokenIds) {
        return venueCoupons[venueId];
    }
    
    /**
     * @dev Get user's valid (non-redeemed, non-expired) coupons
     * @param user User address
     * @return validTokenIds Array of valid token IDs
     */
    function getUserValidCoupons(address user) external view returns (uint256[] memory validTokenIds) {
        uint256[] memory allCoupons = userCoupons[user];
        uint256 validCount = 0;
        
        // First pass: count valid coupons
        for (uint256 i = 0; i < allCoupons.length; i++) {
            uint256 tokenId = allCoupons[i];
            if (_ownerOf(tokenId) == user) {
                CouponMetadata memory coupon = couponData[tokenId];
                if (!coupon.isRedeemed && block.timestamp <= coupon.expiryTimestamp) {
                    validCount++;
                }
            }
        }
        
        // Second pass: populate valid coupons array
        validTokenIds = new uint256[](validCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCoupons.length; i++) {
            uint256 tokenId = allCoupons[i];
            if (_ownerOf(tokenId) == user) {
                CouponMetadata memory coupon = couponData[tokenId];
                if (!coupon.isRedeemed && block.timestamp <= coupon.expiryTimestamp) {
                    validTokenIds[index] = tokenId;
                    index++;
                }
            }
        }
        
        return validTokenIds;
    }
    
    /**
     * @dev Set base URI for metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string calldata baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(oldURI, baseURI);
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
     * @dev Get current token ID counter
     * @return current Current token ID counter
     */
    function getCurrentTokenId() external view returns (uint256 current) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override tokenURI to use base URI + token ID
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }
    
    /**
     * @dev Override _baseURI to return stored base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Override _update to add pause functionality  
     */
    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    
    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Get contract information
     */
    function getContractInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256 maxSupply_,
        bool isPaused_,
        string memory baseURI_
    ) {
        return (
            name(),
            symbol(),
            _tokenIdCounter - 1, // Total minted
            MAX_SUPPLY,
            paused(),
            _baseTokenURI
        );
    }
}