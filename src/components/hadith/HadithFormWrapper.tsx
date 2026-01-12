/**
 * Client-side Hadith Form Wrapper
 * Handles form submission with router navigation
 *
 * @module src/components/hadith/HadithFormWrapper
 * @agent frontend-engineer
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HadithForm } from './HadithForm';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type HadithInsert = Database['public']['Tables']['hadiths']['Insert'];

interface HadithFormWrapperProps {
    workspaceId: string;
    workspaceSlug: string;
}

export function HadithFormWrapper({ workspaceId, workspaceSlug }: HadithFormWrapperProps) {
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();

    // Get current user ID
    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        };
        getUserId();
    }, [supabase]);

    const handleSubmit = async (data: any) => {
        if (!userId) {
            throw new Error('مطلوب تسجيل الدخول');
        }

        // Build insert data with proper types
        const insertData: HadithInsert = {
            arabic_text: data.arabicText?.normalize('NFC') || '',
            english_translation: data.englishTranslation || null,
            workspace_id: workspaceId,
            grading: data.grading || null,
            narrator_ids: data.narratorIds || [],
            topic_tags: data.topicTags || [],
            collection: data.collection || null,
            book_number: data.bookNumber || null,
            hadith_number: data.hadithNumber || null,
            notes: data.notes || null,
            created_by: userId,
        };

        const { data: hadith, error } = await supabase
            .from('hadiths')
            .insert(insertData as any)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        setSuccessMessage('تم حفظ الحديث بنجاح');
        setTimeout(() => {
            router.push(`/workspace/${workspaceSlug}`);
        }, 1500);

        return hadith;
    };

    return (
        <>
            {successMessage && (
                <div
                    className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
                    role="alert"
                    dir="rtl"
                >
                    {successMessage}
                </div>
            )}
            <HadithForm workspaceId={workspaceId} onSubmit={handleSubmit} />
        </>
    );
}

export default HadithFormWrapper;
