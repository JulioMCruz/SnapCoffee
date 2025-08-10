import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from '@/config';
import { ApiResponse, ValidationError, NotFoundError, UnauthorizedError } from '@/types';

// CORS Configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (config.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
});

// Security Headers
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.coinbase.com", "https://base.org"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Request Logging
export const loggingMiddleware = morgan(config.LOG_FORMAT, {
  skip: (req) => {
    // Skip health check logs in production
    return config.NODE_ENV === 'production' && req.url === config.HEALTH_CHECK_ENDPOINT;
  },
});

// Request Validation Middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body, params, and query
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      next();
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation Error',
        message: error.errors?.[0]?.message || 'Invalid request data',
      };
      res.status(400).json(response);
    }
  };
};

// Rate Limiting Middleware (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  maxRequests: number = config.RATE_LIMIT.MAX_REQUESTS,
  windowMs: number = config.RATE_LIMIT.WINDOW_MS
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // Get or create client record
    let clientData = requestCounts.get(clientId);
    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 0, resetTime: now + windowMs };
    }
    
    // Check if rate limit exceeded
    if (clientData.count >= maxRequests) {
      const response: ApiResponse = {
        success: false,
        error: 'Rate Limit Exceeded',
        message: 'Too many requests, please try again later',
      };
      return res.status(429).json(response);
    }
    
    // Increment counter and update
    clientData.count++;
    requestCounts.set(clientId, clientData);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      const cutoff = now;
      for (const [key, data] of requestCounts.entries()) {
        if (cutoff > data.resetTime) {
          requestCounts.delete(key);
        }
      }
    }
    
    next();
  };
};

// Farcaster Webhook Validation
export const validateFarcasterWebhook = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-farcaster-signature'] as string;
  
  if (!signature && config.NODE_ENV === 'production') {
    const response: ApiResponse = {
      success: false,
      error: 'Unauthorized',
      message: 'Missing Farcaster signature',
    };
    return res.status(401).json(response);
  }
  
  // TODO: Implement proper signature validation
  // For now, just continue in development
  next();
};

// Error Handling Middleware
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Error ${req.method} ${req.path}:`, error);
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  if (error instanceof ValidationError) {
    statusCode = 400;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    message = error.message;
  } else if (error instanceof UnauthorizedError) {
    statusCode = 401;
    message = error.message;
  } else if (error.message.includes('Not allowed by CORS')) {
    statusCode = 403;
    message = 'CORS: Origin not allowed';
  }
  
  const response: ApiResponse = {
    success: false,
    error: error.name || 'Error',
    message,
    ...(config.NODE_ENV === 'development' && { stack: error.stack }),
  };
  
  res.status(statusCode).json(response);
};

// 404 Handler
export const notFoundMiddleware = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  };
  res.status(404).json(response);
};

// Health Check Middleware
export const healthCheckMiddleware = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: config.APP_VERSION,
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  };
  res.json(response);
};

// Request ID Middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('x-request-id', requestId);
  
  next();
};