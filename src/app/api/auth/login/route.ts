import { NextResponse } from 'next/server';
import { authenticateUser, validateSession, invalidateSession, changePassword } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ============================================
    // LOGIN ACTION
    // ============================================
    if (action === 'log_login') {
      // Just log the login (called from client after successful login)
      return NextResponse.json({ success: true });
    }

    if (action === 'change_password') {
      const { userId, currentPassword, newPassword } = body;
      const result = await changePassword(userId, currentPassword, newPassword);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === 'logout') {
      const { token } = body;
      if (token) {
        await invalidateSession(token);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'validate') {
      const { token } = body;
      if (!token) {
        return NextResponse.json({ valid: false }, { status: 401 });
      }
      const user = await validateSession(token);
      return NextResponse.json({ valid: !!user, user });
    }

    // ============================================
    // MAIN LOGIN
    // ============================================
    const { email, password, branchId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Authenticate user
    const result = await authenticateUser(email, password, {
      userAgent,
      ipAddress,
    }, branchId);

    if (!result.success) {
      const response: Record<string, unknown> = { error: result.error };
      if (result.isLocked) response.isLocked = true;
      if (result.remainingAttempts !== undefined) {
        response.remainingAttempts = result.remainingAttempts;
        response.warning = result.remainingAttempts <= 2
          ? `Warning: ${result.remainingAttempts} attempts remaining before account lockout`
          : undefined;
      }
      return NextResponse.json(response, { status: 401 });
    }

    // Get branch name if branchId provided
    let branchName = undefined;
    if (branchId) {
      const { supabase } = await import('@/lib/db');
      const { data: branch } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single();
      branchName = branch?.name;
    }

    return NextResponse.json({
      success: true,
      user: {
        ...result.user,
        branchId,
        branchName,
      },
      token: result.token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const user = await validateSession(token);
  return NextResponse.json({ valid: !!user, user });
}
