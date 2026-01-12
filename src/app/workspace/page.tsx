/**
 * Workspace Landing Page
 * Lists all workspaces for the authenticated user
 * 
 * @module src/app/workspace/page
 * @agent frontend-engineer
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Workspace {
    id: string
    name: string
    created_at: string
}

export default function WorkspaceListPage() {
    const supabase = getClient()
    const router = useRouter()
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadWorkspaces() {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.push('/auth/login')
                    return
                }

                // Load workspaces for the user
                const { data, error } = await supabase
                    .from('workspaces')
                    .select('id, name, created_at')
                    .order('created_at', { ascending: false })

                if (error) throw error

                setWorkspaces(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'خطأ في تحميل مساحات العمل')
            } finally {
                setLoading(false)
            }
        }

        loadWorkspaces()
    }, [supabase, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1
                        className="text-3xl font-bold text-gray-900"
                        dir="rtl"
                        lang="ar"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'right' }}
                    >
                        مساحات العمل
                    </h1>
                    <p className="mt-2 text-gray-600" dir="rtl">
                        Workspaces
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" dir="rtl">
                        {error}
                    </div>
                )}

                {/* Workspaces List */}
                {workspaces.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <p className="text-gray-600 mb-4" dir="rtl">
                            لا توجد مساحات عمل بعد
                        </p>
                        <p className="text-sm text-gray-500">
                            No workspaces yet. Create one to get started.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {workspaces.map((workspace) => (
                            <Link
                                key={workspace.id}
                                href={`/workspace/${workspace.id}/documents`}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                            >
                                <h2
                                    className="text-xl font-semibold text-gray-900"
                                    dir="rtl"
                                    lang="ar"
                                    style={{ unicodeBidi: 'plaintext', textAlign: 'right' }}
                                >
                                    {workspace.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-2">
                                    {new Date(workspace.created_at).toLocaleDateString('ar-SA')}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Logout Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/auth/login')
                        }}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        تسجيل الخروج | Logout
                    </button>
                </div>
            </div>
        </div>
    )
}
