/**
 * Home Page - Landing/Redirect Page
 * Redirects users to login or workspace based on auth status
 * 
 * @module src/app/page
 * @agent frontend-engineer
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/server'

export default async function HomePage() {
    const session = await getSession()

    if (session) {
        // User is authenticated, redirect to workspace
        redirect('/workspace')
    } else {
        // User is not authenticated, redirect to login
        redirect('/auth/login')
    }
}
