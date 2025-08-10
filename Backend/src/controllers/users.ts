import { Request, Response } from 'express';
import { config } from '@/config';
import { CDPWalletService } from '@/services/cdp-wallet';
import { validateAddress } from '@/utils/validation';

// Mock users database - in production, use a real database
const mockUsers = [
  {
    fid: 12345,
    username: "coffeeking",
    displayName: "Coffee King ☕",
    pfpUrl: "/placeholder.svg",
    bio: "NYC's premier coffee curator. 500+ cafés reviewed. Sharing the best coffee experiences across the city.",
    address: "0x1234567890123456789012345678901234567890",
    followerCount: 12500,
    followingCount: 234,
    coffeeCount: 342,
    totalTips: 1250.50,
    recentTips: 45.25,
    joinedDate: "2023-06-15",
    topCafes: ["Blue Bean", "Roast & Co.", "Urban Grind", "Italian Corner", "Pure Espresso"],
    badges: ["Top Reviewer", "NYC Expert", "Morning Enthusiast", "Community Leader"],
    recentPosts: [
      {
        id: 1,
        image: "/placeholder.svg",
        cafe: "Blue Bean Cafe",
        coffeeType: "Latte",
        rating: 5,
        pairing: "almond croissant",
        location: "SoHo",
        timestamp: "2024-01-08T09:30:00Z",
        likes: 24,
        tips: 12.50
      },
      {
        id: 2,
        image: "/placeholder.svg",
        cafe: "Roast & Co.",
        coffeeType: "Cold Brew",
        rating: 4,
        location: "East Village",
        timestamp: "2024-01-07T14:15:00Z",
        likes: 18,
        tips: 8.25
      },
      {
        id: 3,
        image: "/placeholder.svg",
        cafe: "Urban Grind",
        coffeeType: "Espresso",
        rating: 5,
        pairing: "dark chocolate",
        location: "Williamsburg",
        timestamp: "2024-01-06T08:45:00Z",
        likes: 31,
        tips: 15.75
      }
    ],
    achievements: [
      { name: "Early Bird", description: "Posted 50 morning coffees", icon: "☀️" },
      { name: "Explorer", description: "Visited 100+ unique cafés", icon: "🗺️" },
      { name: "Community Favorite", description: "Received 500+ tips", icon: "💖" }
    ],
    usdcBalance: 45.75
  },
  {
    fid: 23456,
    username: "lattelover",
    displayName: "Emma the Latte Lover",
    pfpUrl: "/placeholder.svg",
    bio: "Latte art photographer & coffee shop explorer",
    address: "0x2345678901234567890123456789012345678901",
    followerCount: 8900,
    followingCount: 456,
    coffeeCount: 156,
    totalTips: 892.75,
    recentTips: 32.00,
    joinedDate: "2023-08-22",
    topCafes: ["Cuppa Corner", "Brew Haven", "The Daily Grind"],
    badges: ["Latte Artist", "Photo Pro", "Rising Star"],
    usdcBalance: 28.50
  },
  {
    fid: 34567,
    username: "espressoenthusiast",
    displayName: "Marco ☕ Espresso",
    pfpUrl: "/placeholder.svg",
    bio: "Espresso perfectionist. Former barista. Coffee educator.",
    address: "0x3456789012345678901234567890123456789012",
    followerCount: 15200,
    followingCount: 189,
    coffeeCount: 489,
    totalTips: 2100.25,
    recentTips: 78.50,
    joinedDate: "2023-05-10",
    topCafes: ["Italian Corner", "Pure Espresso", "Barista Central"],
    badges: ["Espresso Master", "Educator", "Community Leader"],
    usdcBalance: 156.25
  },
  {
    fid: 45678,
    username: "coldbrew_queen",
    displayName: "Sofia | Cold Brew Queen",
    pfpUrl: "/placeholder.svg",
    bio: "Cold brew specialist. Summer coffee adventures.",
    address: "0x4567890123456789012345678901234567890123",
    followerCount: 6750,
    followingCount: 298,
    coffeeCount: 201,
    totalTips: 445.00,
    recentTips: 18.75,
    joinedDate: "2023-09-03",
    topCafes: ["Ice Coffee Co.", "Chill Beans", "Summer Roast"],
    badges: ["Cold Brew Expert", "Summer Specialist"],
    usdcBalance: 32.10
  }
];

/**
 * Get all coffee creators/influencers
 */
export const getCreators = async (req: Request, res: Response) => {
  try {
    const { search, sortBy = 'tips', limit = 20 } = req.query;

    let filteredUsers = [...mockUsers];

    // Search filter
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.bio.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filteredUsers.sort((a, b) => {
      switch (sortBy) {
        case 'tips':
          return b.totalTips - a.totalTips;
        case 'coffees':
          return b.coffeeCount - a.coffeeCount;
        case 'followers':
          return b.followerCount - a.followerCount;
        default:
          return 0;
      }
    });

    // Limit results
    const limitNum = parseInt(limit as string) || 20;
    filteredUsers = filteredUsers.slice(0, limitNum);

    res.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
      total: mockUsers.length
    });

  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch creators',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get user by FID
 */
export const getUserByFid = async (req: Request, res: Response) => {
  try {
    const { fid } = req.params;
    const fidNum = parseInt(fid);

    if (!fidNum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FID',
        message: 'FID must be a valid number'
      });
    }

    const user = mockUsers.find(u => u.fid === fidNum);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `No user found with FID ${fidNum}`
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get current user's USDC balance
 */
export const getUserBalance = async (req: Request, res: Response) => {
  try {
    // In production, you would:
    // 1. Get user from authentication middleware
    // 2. Query their USDC balance on Base network
    // 3. Return the current balance

    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address required',
        message: 'Wallet address is required to check balance'
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
      });
    }

    // Find user by address (in production, this would be a database query)
    const user = mockUsers.find(u => u.address.toLowerCase() === address.toLowerCase());
    const balance = user?.usdcBalance || 0;

    // In production, you would query the actual USDC balance on Base
    // using Web3 or the CDP SDK
    // const balance = await getUSDCBalance(address);

    res.json({
      success: true,
      data: {
        address,
        balance,
        currency: 'USDC',
        network: 'base',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Send tip between users
 */
export const sendTip = async (req: Request, res: Response) => {
  try {
    const { toUserId, amount, fromAddress } = req.body;

    // Validation
    if (!toUserId || !amount || !fromAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'toUserId, amount, and fromAddress are required'
      });
    }

    if (!validateAddress(fromAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid from address',
        message: 'Please provide a valid sender address'
      });
    }

    const tipAmount = parseFloat(amount);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Find sender and recipient
    const sender = mockUsers.find(u => u.address.toLowerCase() === fromAddress.toLowerCase());
    const recipient = mockUsers.find(u => u.fid === parseInt(toUserId));

    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found',
        message: 'Sender address not found in our system'
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found',
        message: 'Recipient user not found'
      });
    }

    // Check balance
    if (sender.usdcBalance < tipAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        message: `Insufficient USDC balance. Available: ${sender.usdcBalance}, Required: ${tipAmount}`
      });
    }

    // In production, this would:
    // 1. Create and execute USDC transfer transaction on Base
    // 2. Update both users' balances in the database
    // 3. Record the tip transaction for analytics
    // 4. Send notifications

    // For demo, update mock balances
    sender.usdcBalance -= tipAmount;
    recipient.usdcBalance += tipAmount;
    recipient.totalTips += tipAmount;
    recipient.recentTips += tipAmount;

    res.json({
      success: true,
      data: {
        transactionId: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: sender.address,
        to: recipient.address,
        amount: tipAmount,
        currency: 'USDC',
        network: 'base',
        timestamp: new Date().toISOString(),
        newBalance: sender.usdcBalance
      },
      message: `Successfully sent ${tipAmount} USDC to ${recipient.displayName}`
    });

  } catch (error) {
    console.error('Send tip error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send tip',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update user balance after onramp
 */
export const updateBalanceAfterOnramp = async (req: Request, res: Response) => {
  try {
    const { address, amount, transactionId } = req.body;

    if (!address || !amount || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'address, amount, and transactionId are required'
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
      });
    }

    const addAmount = parseFloat(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Find user by address
    const user = mockUsers.find(u => u.address.toLowerCase() === address.toLowerCase());

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User address not found in our system'
      });
    }

    // Update balance
    user.usdcBalance += addAmount;

    res.json({
      success: true,
      data: {
        address,
        previousBalance: user.usdcBalance - addAmount,
        newBalance: user.usdcBalance,
        amountAdded: addAmount,
        transactionId,
        timestamp: new Date().toISOString()
      },
      message: `Successfully added ${addAmount} USDC to wallet`
    });

  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update balance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};