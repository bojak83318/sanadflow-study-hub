/**
 * Auth Callback Handler
 * Handles OAuth redirects and magic link confirmations
 * 
 * @module src/app/auth/callback/route
 * @agent frontend-engineer
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Handle different callback types
            if (type === 'recovery') {
                // Password recovery - redirect to password reset page
                return NextResponse.redirect(`${origin}/auth/reset-password`)
            }

            // Normal login/signup - redirect to dashboard
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return error page if something went wrong
    return NextResponse.redirect(`${origin}/auth/error?message=could_not_authenticate`)
}
