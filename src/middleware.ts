import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Stale 'viagens_auth_token' check removed.
    // Real Supabase Auth is handled client-side in AppLayout for now.
    // If server-side protection is needed, we should install @supabase/ssr.
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/trips/:path*', '/login'],
};
