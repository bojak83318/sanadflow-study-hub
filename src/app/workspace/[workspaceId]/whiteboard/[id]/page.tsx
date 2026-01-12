/**
 * Whiteboard Page for Workspace
 * Phase 3: Real-time Collaboration - FE-006
 *
 * @module src/app/workspace/[workspaceId]/whiteboard/[id]/page
 * @agent frontend-engineer
 */

import { Suspense } from 'react';
import { CollaborativeWhiteboard } from '@/components/whiteboard/CollaborativeWhiteboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface WhiteboardPageProps {
    params: {
        workspaceId: string;
        id: string;
    };
}

export default async function WhiteboardPage({ params }: WhiteboardPageProps) {
    const { workspaceId, id: diagramId } = params;

    // Get user session
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/auth/login');
    }

    // Generate room ID for real-time sync
    const roomId = `whiteboard-${workspaceId}-${diagramId}`;

    // Get user metadata for presence
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم';
    const userColor = user.user_metadata?.color || '#4a69bd';

    return (
        <main className="h-screen w-screen overflow-hidden">
            <Suspense
                fallback={
                    <div
                        className="flex items-center justify-center h-screen bg-gray-100"
                        dir="rtl"
                        lang="ar"
                    >
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <span className="text-gray-600 text-lg">جاري تحميل السبورة...</span>
                        </div>
                    </div>
                }
            >
                <CollaborativeWhiteboard
                    diagramId={diagramId}
                    workspaceId={workspaceId}
                    roomId={roomId}
                    userName={userName}
                    userColor={userColor}
                />
            </Suspense>
        </main>
    );
}

export const metadata = {
    title: 'سبورة الإعراب - SanadFlow',
    description: 'سبورة تفاعلية لرسم أشجار الإعراب',
};
