/**
 * Hadith Form Component
 * Phase 3 Deliverable (Frontend RTL Integration)
 * 
 * Agent: frontend-engineer
 * Requirements: TDD_v2.0.md Section 5.1
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ArabicTextEditor, BilingualTextEditor } from './ArabicTextEditor';

interface HadithFormProps {
    workspaceId: string;
    onSubmit: (data: HadithInput) => Promise<void>;
    initialData?: HadithInput;
    isEditing?: boolean;
}

interface HadithInput {
    arabicText: string;
    englishTranslation?: string;
    collection?: string;
    bookNumber?: string;
    hadithNumber?: string;
    grading?: 'SAHIH' | 'HASAN' | 'DAIF' | 'MAWDU';
    narratorIds?: string[];
    topicTags?: string[];
    notes?: string;
}

const GRADING_OPTIONS = [
    { value: 'SAHIH', labelAr: 'صحيح', labelEn: 'Sahih', color: 'bg-green-100 text-green-800' },
    { value: 'HASAN', labelAr: 'حسن', labelEn: 'Hasan', color: 'bg-blue-100 text-blue-800' },
    { value: 'DAIF', labelAr: 'ضعيف', labelEn: "Da'if", color: 'bg-yellow-100 text-yellow-800' },
    { value: 'MAWDU', labelAr: 'موضوع', labelEn: "Mawdu'", color: 'bg-red-100 text-red-800' },
];

const COLLECTION_OPTIONS = [
    'Sahih al-Bukhari',
    'Sahih Muslim',
    'Sunan Abu Dawud',
    'Jami` at-Tirmidhi',
    'Sunan an-Nasa\'i',
    'Sunan Ibn Majah',
    'Muwatta Malik',
    'Musnad Ahmad',
];

export function HadithForm({
    workspaceId,
    onSubmit,
    initialData,
    isEditing = false,
}: HadithFormProps) {
    const [formData, setFormData] = useState<HadithInput>(initialData || {
        arabicText: '',
        englishTranslation: '',
        collection: '',
        bookNumber: '',
        hadithNumber: '',
        grading: undefined,
        topicTags: [],
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const handleInputChange = useCallback((field: keyof HadithInput, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate required field
        if (!formData.arabicText.trim()) {
            setError('النص العربي مطلوب');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            setLastSaved(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoSave = useCallback(async (arabicText: string) => {
        // Only auto-save if there's meaningful content
        if (arabicText.trim().length > 10) {
            try {
                await onSubmit({ ...formData, arabicText });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }
    }, [formData, onSubmit]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 max-w-2xl mx-auto p-6"
            dir="rtl"
            lang="ar"
        >
            {/* Error display */}
            {error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                    role="alert"
                    dir="rtl"
                    data-testid="error-message"
                >
                    {error}
                </div>
            )}

            {/* Arabic Text (Required) */}
            <div>
                <label
                    htmlFor="arabicText"
                    className="block text-lg font-semibold mb-2"
                    dir="rtl"
                >
                    نص الحديث (مطلوب)
                </label>
                <ArabicTextEditor
                    value={formData.arabicText}
                    onChange={(value) => handleInputChange('arabicText', value)}
                    placeholder="أدخل نص الحديث الشريف..."
                    multiline
                    autoSave
                    onSave={handleAutoSave}
                />
            </div>

            {/* English Translation */}
            <div>
                <label
                    htmlFor="englishTranslation"
                    className="block text-lg font-semibold mb-2"
                    dir="rtl"
                >
                    الترجمة الإنجليزية
                </label>
                <BilingualTextEditor
                    value={formData.englishTranslation || ''}
                    onChange={(value) => handleInputChange('englishTranslation', value)}
                    placeholder="Enter English translation..."
                />
            </div>

            {/* Collection and Number */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block font-semibold mb-2" dir="rtl">المصدر</label>
                    <select
                        value={formData.collection || ''}
                        onChange={(e) => handleInputChange('collection', e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        dir="rtl"
                    >
                        <option value="">اختر المصدر</option>
                        {COLLECTION_OPTIONS.map((collection) => (
                            <option key={collection} value={collection}>
                                {collection}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-semibold mb-2" dir="rtl">رقم الكتاب</label>
                    <input
                        type="text"
                        value={formData.bookNumber || ''}
                        onChange={(e) => handleInputChange('bookNumber', e.target.value)}
                        placeholder="مثال: 1"
                        className="w-full p-3 border rounded-lg"
                        dir="ltr"
                    />
                </div>

                <div>
                    <label className="block font-semibold mb-2" dir="rtl">رقم الحديث</label>
                    <input
                        type="text"
                        value={formData.hadithNumber || ''}
                        onChange={(e) => handleInputChange('hadithNumber', e.target.value)}
                        placeholder="مثال: 6018"
                        className="w-full p-3 border rounded-lg"
                        dir="ltr"
                    />
                </div>
            </div>

            {/* Grading */}
            <div>
                <label className="block text-lg font-semibold mb-2" dir="rtl">
                    درجة الحديث
                </label>
                <div className="flex gap-3 flex-wrap" data-testid="grading-select">
                    {GRADING_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('grading', option.value)}
                            className={`px-4 py-2 rounded-full border transition-all ${formData.grading === option.value
                                    ? option.color + ' border-current font-bold'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            <span dir="rtl">{option.labelAr}</span>
                            <span className="mx-1 text-gray-400">|</span>
                            <span dir="ltr">{option.labelEn}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Topic Tags */}
            <div>
                <label className="block font-semibold mb-2" dir="rtl">
                    الموضوعات
                </label>
                <input
                    type="text"
                    placeholder="الإيمان، الصلاة، الزكاة (مفصولة بفاصلة)"
                    onChange={(e) => {
                        const tags = e.target.value.split('،').map((t) => t.trim()).filter(Boolean);
                        handleInputChange('topicTags', tags);
                    }}
                    className="w-full p-3 border rounded-lg"
                    dir="rtl"
                />
            </div>

            {/* Notes */}
            <div>
                <label className="block font-semibold mb-2" dir="rtl">ملاحظات</label>
                <BilingualTextEditor
                    value={formData.notes || ''}
                    onChange={(value) => handleInputChange('notes', value)}
                    placeholder="أضف ملاحظات..."
                />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting || !formData.arabicText.trim()}
                    className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${isSubmitting || !formData.arabicText.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    data-testid="submit-btn"
                >
                    {isSubmitting ? 'جارٍ الحفظ...' : isEditing ? 'تحديث الحديث' : 'حفظ الحديث'}
                </button>

                {lastSaved && (
                    <span className="text-sm text-gray-500" dir="rtl">
                        آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
                    </span>
                )}
            </div>
        </form>
    );
}

export default HadithForm;
