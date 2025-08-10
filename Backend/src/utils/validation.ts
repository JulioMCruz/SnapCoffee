/**
 * Validation utilities for the Snap Coffee backend
 */

/**
 * Validate Ethereum address format
 * @param address - Ethereum address to validate
 * @returns boolean - true if valid address format
 */
export const validateAddress = (address: string): boolean => {
  // Basic Ethereum address validation
  // Must be 42 characters long and start with 0x
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
};

/**
 * Validate FID (Farcaster ID) format
 * @param fid - Farcaster ID to validate
 * @returns boolean - true if valid FID
 */
export const validateFID = (fid: string | number): boolean => {
  const fidNum = typeof fid === 'string' ? parseInt(fid) : fid;
  return !isNaN(fidNum) && fidNum > 0 && fidNum < 1000000000; // Reasonable FID range
};

/**
 * Validate USDC amount
 * @param amount - Amount to validate
 * @returns boolean - true if valid amount
 */
export const validateAmount = (amount: string | number): boolean => {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(amountNum) && amountNum > 0 && amountNum <= 10000; // Max $10k per transaction
};

/**
 * Validate transaction ID format
 * @param txId - Transaction ID to validate
 * @returns boolean - true if valid transaction ID
 */
export const validateTransactionId = (txId: string): boolean => {
  // Basic validation - should be a non-empty string
  // In production, you might validate specific formats (e.g., blockchain tx hashes)
  return typeof txId === 'string' && txId.length > 0 && txId.length < 200;
};

/**
 * Sanitize user input
 * @param input - Input string to sanitize
 * @returns string - Sanitized input
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
};

/**
 * Validate search query
 * @param query - Search query to validate
 * @returns boolean - true if valid search query
 */
export const validateSearchQuery = (query: string): boolean => {
  if (typeof query !== 'string') return false;
  
  const trimmed = query.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};