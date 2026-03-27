/**
 * Get Log Context from Request
 * Extracts user information and request metadata for activity logging
 */

import { NextRequest } from 'next/server';
import { LogContext } from './activity-logger';

/**
 * Extract logging context from HTTP request headers
 * Used to capture who made the change and from where
 */
export function getLogContext(request: NextRequest): LogContext {
  return {
    userId: request.headers.get('x-user-id') || undefined,
    userName: request.headers.get('x-user-name') || undefined,
    userRole: request.headers.get('x-user-role') || undefined,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    branchId: request.headers.get('x-branch-id') || undefined,
  };
}

/**
 * Headers to include in API requests from frontend for proper logging
 */
export function getLogHeaders(user: { id?: string; name?: string; role?: string } | null, branchId?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (user?.id) headers['x-user-id'] = user.id;
  if (user?.name) headers['x-user-name'] = user.name;
  if (user?.role) headers['x-user-role'] = user.role;
  if (branchId) headers['x-branch-id'] = branchId;
  
  return headers;
}
