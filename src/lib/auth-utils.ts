import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './db';

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'dokan-super-secret-key-2024';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

// Maximum failed login attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions?: Record<string, boolean>;
  branchId?: string;
  branchName?: string;
  mustChangePassword?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  isLocked?: boolean;
  remainingAttempts?: number;
}

export interface DecodedToken {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// ============================================
// PASSWORD FUNCTIONS
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Check if it's a plain text password (for backward compatibility)
  if (!hashedPassword.startsWith('$2')) {
    return password === hashedPassword;
  }
  return bcrypt.compare(password, hashedPassword);
}

export function isPasswordHashed(password: string): boolean {
  return password.startsWith('$2a$') || password.startsWith('$2b$');
}

// ============================================
// JWT TOKEN FUNCTIONS
// ============================================

export function generateToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { userId, sessionId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createSession(userId: string, branchId: string, deviceInfo: {
  userAgent: string;
  ipAddress: string;
}): Promise<string> {
  const sessionId = uuidv4();
  const sessionToken = generateToken(userId, sessionId);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Store session in database
  await supabase.from('user_sessions').insert({
    id: sessionId,
    user_id: userId,
    session_token: sessionToken,
    device_info: { userAgent: deviceInfo.userAgent },
    ip_address: deviceInfo.ipAddress,
    user_agent: deviceInfo.userAgent,
    is_active: true,
    expires_at: expiresAt.toISOString(),
    last_activity_at: new Date().toISOString(),
  });

  return sessionToken;
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Check if session exists and is active
  const { data: session } = await supabase
    .from('user_sessions')
    .select('*, app_users(*)')
    .eq('id', decoded.sessionId)
    .eq('is_active', true)
    .single();

  if (!session) return null;

  // Check if session expired
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('user_sessions').update({ is_active: false }).eq('id', decoded.sessionId);
    return null;
  }

  // Update last activity
  await supabase
    .from('user_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', decoded.sessionId);

  const user = session.app_users as Record<string, unknown>;
  return {
    id: user.id as string,
    name: user.name as string,
    email: user.email as string,
    username: user.username as string,
    role: user.role as string,
    permissions: user.permissions as Record<string, boolean>,
    mustChangePassword: user.must_change_password as boolean,
  };
}

export async function invalidateSession(token: string): Promise<void> {
  const decoded = verifyToken(token);
  if (!decoded) return;

  await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('id', decoded.sessionId);
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);
}

// ============================================
// LOGIN ATTEMPT TRACKING
// ============================================

export async function recordLoginAttempt(
  userId: string,
  success: boolean,
  deviceInfo: { userAgent: string; ipAddress: string },
  failureReason?: string
): Promise<void> {
  await supabase.from('login_history').insert({
    user_id: userId,
    login_at: new Date().toISOString(),
    ip_address: deviceInfo.ipAddress,
    user_agent: deviceInfo.userAgent,
    device_info: { userAgent: deviceInfo.userAgent },
    status: success ? 'success' : 'failed',
    failure_reason: failureReason,
  });

  if (!success) {
    // Increment failed attempts
    await incrementFailedAttempts(userId);
  } else {
    // Reset failed attempts on successful login
    await supabase
      .from('app_users')
      .update({ 
        failed_login_attempts: 0,
        last_failed_login_at: null,
        last_login: new Date().toISOString()
      })
      .eq('id', userId);
  }
}

export async function incrementFailedAttempts(userId: string): Promise<void> {
  const { data: user } = await supabase
    .from('app_users')
    .select('failed_login_attempts')
    .eq('id', userId)
    .single();

  const currentAttempts = (user?.failed_login_attempts || 0) + 1;
  const updateData: Record<string, unknown> = {
    failed_login_attempts: currentAttempts,
    last_failed_login_at: new Date().toISOString(),
  };

  // Lock account if max attempts reached
  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockoutUntil = new Date();
    lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
    updateData.locked_until = lockoutUntil.toISOString();
  }

  await supabase.from('app_users').update(updateData).eq('id', userId);
}

export async function checkAccountLockStatus(userId: string): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
}> {
  const { data: user } = await supabase
    .from('app_users')
    .select('failed_login_attempts, locked_until')
    .eq('id', userId)
    .single();

  if (!user) {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Check if locked
  if (user.locked_until) {
    const lockedUntil = new Date(user.locked_until);
    if (lockedUntil > new Date()) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockedUntil,
      };
    } else {
      // Lock expired, reset
      await supabase
        .from('app_users')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq('id', userId);
    }
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - (user.failed_login_attempts || 0),
  };
}

// ============================================
// MAIN LOGIN FUNCTION
// ============================================

export async function authenticateUser(
  emailOrUsername: string,
  password: string,
  deviceInfo: { userAgent: string; ipAddress: string },
  branchId?: string
): Promise<LoginResult> {
  // Find user by email or username
  let { data: users } = await supabase
    .from('app_users')
    .select('*')
    .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`);

  const user = users?.[0];

  if (!user) {
    return {
      success: false,
      error: 'Invalid email/username or password',
    };
  }

  // Check if account is active
  if (!user.is_active) {
    return {
      success: false,
      error: 'Account is disabled. Contact administrator.',
    };
  }

  // Check lock status
  const lockStatus = await checkAccountLockStatus(user.id);
  if (lockStatus.isLocked) {
    const minutesLeft = Math.ceil(
      ((lockStatus.lockedUntil?.getTime() || 0) - Date.now()) / 60000
    );
    return {
      success: false,
      error: `Account locked. Try again in ${minutesLeft} minutes.`,
      isLocked: true,
    };
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (!isPasswordValid) {
    await recordLoginAttempt(user.id, false, deviceInfo, 'Invalid password');
    const newLockStatus = await checkAccountLockStatus(user.id);
    
    return {
      success: false,
      error: 'Invalid email/username or password',
      remainingAttempts: newLockStatus.remainingAttempts,
    };
  }

  // Create session
  const token = await createSession(user.id, branchId || '', deviceInfo);
  
  // Record successful login
  await recordLoginAttempt(user.id, true, deviceInfo);

  // Migrate plain text password to hash if needed
  if (!isPasswordHashed(user.password)) {
    const hashedPassword = await hashPassword(password);
    await supabase
      .from('app_users')
      .update({ password: hashedPassword })
      .eq('id', user.id);
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      mustChangePassword: user.must_change_password,
    },
    token,
  };
}

// ============================================
// PASSWORD RESET
// ============================================

export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const { data: user } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', email)
    .single();

  if (!user) return null;

  const resetToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  // Store reset token (you might need a password_resets table)
  // For now, we'll store it in user's record temporarily
  await supabase
    .from('app_users')
    .update({
      password_reset_token: resetToken,
      password_reset_expires: expiresAt.toISOString(),
    })
    .eq('id', user.id);

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const hashedPassword = await hashPassword(newPassword);
  
  const { data: user } = await supabase
    .from('app_users')
    .select('id')
    .eq('password_reset_token', token)
    .gt('password_reset_expires', new Date().toISOString())
    .single();

  if (!user) return false;

  await supabase
    .from('app_users')
    .update({
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  return true;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { data: user } = await supabase
    .from('app_users')
    .select('password')
    .eq('id', userId)
    .single();

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isPasswordValid = await verifyPassword(currentPassword, user.password);
  if (!isPasswordValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  const hashedPassword = await hashPassword(newPassword);
  
  await supabase
    .from('app_users')
    .update({
      password: hashedPassword,
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { success: true };
}
