import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login'];

// Role-based route prefixes
const roleRoutes: Record<string, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Verify session by calling the session API
    const sessionResponse = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        Cookie: `session=${sessionCookie.value}`,
      },
    });
    
    if (!sessionResponse.ok) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
    
    const sessionData = await sessionResponse.json();
    const user = sessionData.user;
    
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
    
    // Check role-based access
    const userRole = user.role as string;
    const allowedPrefix = roleRoutes[userRole];
    
    // If trying to access a role-specific route
    for (const [role, prefix] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(prefix) && role !== userRole) {
        // Redirect to their own dashboard
        const dashboardUrl = new URL(`${allowedPrefix}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // If accessing root, redirect to appropriate dashboard
    if (pathname === '/') {
      const dashboardUrl = new URL(`${allowedPrefix}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
