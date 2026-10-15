import { getFirebaseAdmin } from '../firebase/admin';
import { dbService } from '../db/store';
import { User, UserRole } from '@/types';

export interface AuthContextResult {
  user: User;
  organizationId: string;
  role: UserRole;
  isMockAuth: boolean;
}

export async function authenticateRequest(
  request: Request,
  requiredRoles: UserRole[] = ['manager', 'admin']
): Promise<{ auth: AuthContextResult | null; errorResponse?: Response }> {
  const authHeader = request.headers.get('authorization');
  const orgHeader = request.headers.get('x-organization-id') || 'org_amc_default';
  const mockUserId = request.headers.get('x-user-id') || 'user_manager_1';
  const mockUserRole = (request.headers.get('x-user-role') as UserRole) || 'manager';

  const { adminAuth } = getFirebaseAdmin();

  let user: User | null = null;
  let isMock = true;

  if (adminAuth && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      // Fetch authoritative user from db
      const dbUser = await dbService.getUser(decoded.uid);
      if (dbUser) {
        user = dbUser;
        isMock = false;
      } else {
        // First login via Firebase, create profile with employee role default
        user = {
          uid: decoded.uid,
          name: decoded.name || decoded.email?.split('@')[0] || 'User',
          email: decoded.email || '',
          role: 'employee',
          organizationId: orgHeader,
          createdAt: new Date().toISOString(),
        };
        await dbService.saveUser(user);
        isMock = false;
      }
    } catch (err) {
      console.warn('Firebase token verification failed:', err);
      return {
        auth: null,
        errorResponse: new Response(
          JSON.stringify({ error: 'Invalid or expired authentication token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
  }

  // Fallback to local dev / verified session user
  if (!user) {
    const existing = await dbService.getUser(mockUserId);
    if (existing) {
      user = existing;
    } else {
      user = {
        uid: mockUserId,
        name: 'Demo Manager',
        email: 'manager@amc-workforce.io',
        role: mockUserRole,
        organizationId: orgHeader,
        createdAt: new Date().toISOString(),
      };
      await dbService.saveUser(user);
    }
  }

  // Enforce role authorization
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return {
      auth: null,
      errorResponse: new Response(
        JSON.stringify({ error: `Forbidden: role '${user.role}' lacks sufficient privileges` }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return {
    auth: {
      user,
      organizationId: user.organizationId,
      role: user.role,
      isMockAuth: isMock,
    },
  };
}
