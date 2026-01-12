/**
 * useAuth Hook
 * Client-side authentication state management
 * 
 * @module src/hooks/useAuth
 * @agent frontend-engineer
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    error: Error | null
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    })

    const supabase = getClient()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
                error: error ?? null,
            })
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                    error: null,
                })
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase])

    const signIn = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setState(prev => ({ ...prev, loading: false, error }))
            return { error }
        }

        return { data }
    }, [supabase])

    const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName ?? email.split('@')[0],
                },
            },
        })

        if (error) {
            setState(prev => ({ ...prev, loading: false, error }))
            return { error }
        }

        return { data }
    }, [supabase])

    const signOut = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        const { error } = await supabase.auth.signOut()

        if (error) {
            setState(prev => ({ ...prev, loading: false, error }))
            return { error }
        }

        return { success: true }
    }, [supabase])

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        })

        if (error) {
            return { error }
        }

        return { success: true }
    }, [supabase])

    return {
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAuthenticated: !!state.user,
    }
}
