import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mock dependencies
jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(),
}));

jest.mock('next/server', () => {
    const original = jest.requireActual('next/server');
    return {
        ...original,
        NextResponse: {
            ...original.NextResponse,
            next: jest.fn().mockImplementation(() => ({
                cookies: { set: jest.fn() },
            })),
            redirect: jest.fn().mockImplementation((url) => ({
                cookies: { set: jest.fn() },
                url: url.toString(),
            })),
        },
    };
});

describe('Supabase Auth Middleware', () => {
    let mockSupabase: any;
    let mockUser: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = null;

        mockSupabase = {
            auth: {
                getUser: jest.fn().mockImplementation(async () => ({
                    data: { user: mockUser },
                })),
            },
        };

        (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    const createReq = (path: string) => {
        return new NextRequest(new URL(`http://localhost${path}`), {
            headers: { 'x-url': `http://localhost${path}` },
        });
    };

    test('should allow public routes', async () => {
        const req = createReq('/');
        await middleware(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    test('should redirect unauthenticated user from protected route to login', async () => {
        const req = createReq('/dashboard');
        await middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/auth/login',
                search: expect.stringContaining('redirectTo=%2Fdashboard'),
            })
        );
    });

    test('should allow authenticated user to access protected route', async () => {
        mockUser = { id: 'user-123', email: 'test@example.com' };

        const req = createReq('/dashboard');
        await middleware(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    test('should redirect authenticated user from auth pages to dashboard', async () => {
        mockUser = { id: 'user-123', email: 'test@example.com' };

        const req = createReq('/auth/login');
        await middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/dashboard',
            })
        );
    });

    test('should refresh session', async () => {
        const req = createReq('/');
        await middleware(req);

        expect(createServerClient).toHaveBeenCalled();
        expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });
});
