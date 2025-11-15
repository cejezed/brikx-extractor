// Auth middleware - Prepared for Supabase JWT auth
import type { Request, Response, NextFunction } from 'express';

// Extended Request type with user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    workspace_id?: string;
  };
}

/**
 * Auth middleware - validates JWT token from Supabase
 * Currently permissive for development, to be restricted later
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // TODO: Implement proper JWT validation with Supabase
  // For now, extract from Authorization header if present

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // TODO: Verify JWT with Supabase
    // const { data, error } = await supabase.auth.getUser(token);

    // Mock user for development
    req.user = {
      id: 'dev-user-id',
      email: 'dev@brikx.app',
    };
  }

  // Continue without user for development (permissive)
  next();
}

/**
 * Require auth middleware - returns 401 if no valid token
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  }

  next();
}

/**
 * Optional auth middleware - adds user if token present, but doesn't require it
 */
export const optionalAuth = authMiddleware;
