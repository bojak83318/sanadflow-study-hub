/**
 * Supabase Server Client
 * For use in Server Components, Route Handlers, and Server Actions
 * 
 * @module src/lib/supabase/server
 * @agent frontend-engineer
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // The `set` method is called from a Server Component
                        // This can be ignored if you have middleware refreshing sessions
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // The `remove` method is called from a Server Component
                    }
                },
            },
        }
    )
}

/**
 * Get the current authenticated user from server context
 */
export async function getUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

/**
 * Get the current session from server context
 */
export async function getSession() {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        return null
    }

    return session
}
