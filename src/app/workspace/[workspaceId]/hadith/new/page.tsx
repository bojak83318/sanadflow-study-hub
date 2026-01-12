/**
 * New Hadith Entry Page
 * Phase 3: Real-time Collaboration - FE-007
 *
 * @module src/app/workspace/[workspaceId]/hadith/new/page
 * @agent frontend-engineer
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HadithFormWrapper } from '@/components/hadith/HadithFormWrapper';

interface NewHadithPageProps {
    params: {
        workspaceId: string;
    };
}

export default async function NewHadithPage({ params }: NewHadithPageProps) {
    const { workspaceId } = params;

    // Get user session
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/auth/login');
    }

    return (
        <main className="min-h-screen bg-gray-50" dir="rtl" lang="ar">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <a href="/workspace" className="hover:text-blue-600">
                            مساحات العمل
                        </a>
                        <span>/</span>
                        <a
                            href={`/workspace/${workspaceId}`}
                            className="hover:text-blue-600"
                        >
                            المساحة
                        </a>
                        <span>/</span>
                        <span className="text-gray-900">حديث جديد</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900">إضافة حديث جديد</h1>
                </div>
            </header>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <HadithFormWrapper
                        workspaceId={workspaceId}
                        workspaceSlug={workspaceId}
                    />
                </div>
            </div>
        </main>
    );
}

export const metadata = {
    title: 'إضافة حديث جديد - SanadFlow',
    description: 'إضافة حديث جديد إلى قاعدة البيانات',
};
