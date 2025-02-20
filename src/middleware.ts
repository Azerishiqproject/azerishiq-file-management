import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedPaths = ['/dashboard', '/upload', '/admin']

export function middleware(request: NextRequest) {
    const token = request.cookies.get('__session')
    const { pathname } = request.nextUrl
    
    // If it's a protected path and there's no token, redirect to login
    if (protectedPaths.some(path => pathname.startsWith(path)) && !token) {
        const loginUrl = new URL('/login', request.url)
        // Store the attempted URL to redirect back after login
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }
    
    // If there's a token and user tries to access login, redirect to dashboard
    if (token && pathname === '/login') {
        // Check if there's a callback URL to redirect to
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
        if (callbackUrl && protectedPaths.some(path => callbackUrl.startsWith(path))) {
            return NextResponse.redirect(new URL(callbackUrl, request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
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
} 