/**
 * Supabase Browser Client
 * For use in Client Components (use client)
 * 
 * @module src/lib/supabase/client
 * @agent frontend-engineer
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// Singleton instance for reuse in client components
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getClient() {
    if (!clientInstance) {
        clientInstance = createClient()
    }
    return clientInstance
}
