import { Request, Response, NextFunction } from 'express';
import config from '@/config';

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

/**
 * Simple API Key Authentication
 * Validates API key from Authorization header or x-api-key header
 */
export const authenticateApiKey = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get API key from headers
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key required'
      });
      return;
    }

    // Compare with configured secret
    if (apiKey !== config.JWT_SECRET) {
      res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
      return;
    }

    // Mark request as authenticated
    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional Authentication
 * Validates API key if present, but doesn't require it
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey && apiKey === config.JWT_SECRET) {
    req.isAuthenticated = true;
  }
  
  next();
};