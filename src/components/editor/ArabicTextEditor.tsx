/**
 * RTL-Aware Arabic Text Editor Component
 * Phase 0: RTL Validation Deliverable
 * 
 * Agent: frontend-engineer
 * Requirements: TDD_v2.0.md Section 5.1
 * 
 * MANDATORY RTL Implementation Rules:
 * 1. dir="rtl" - Always set direction
 * 2. lang="ar" - Specify language for accessibility
 * 3. unicode-bidi: plaintext - Required for cursor handling
 * 4. text-align: right - Align Arabic text
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ArabicTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    multiline?: boolean;
    autoSave?: boolean;
    onSave?: (value: string) => Promise<void>;
}

export function ArabicTextEditor({
    value,
    onChange,
    placeholder = 'أدخل النص هنا...',
    className = '',
    multiline = false,
    autoSave = true,
    onSave,
}: ArabicTextEditorProps) {
    const editorRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save every 10 seconds (per TDD requirement)
    useEffect(() => {
        if (!autoSave || !onSave) return;

        const interval = setInterval(async () => {
            if (value.trim().length > 0) {
                setIsSaving(true);
                try {
                    await onSave(value);
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('Auto-save failed:', error);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [value, autoSave, onSave]);

    // Handle input change with NFC normalization
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        // Normalize Arabic text to NFC form to prevent encoding issues
        const normalizedValue = e.target.value.normalize('NFC');
        onChange(normalizedValue);
    }, [onChange]);

    // Detect if content is primarily Arabic
    const isPrimaryArabic = useCallback((text: string): boolean => {
        const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length || 0;
        const totalChars = text.replace(/\s/g, '').length;
        return totalChars > 0 && arabicChars / totalChars > 0.3;
    }, []);

    // Shared RTL props for accessibility and cursor handling
    const rtlProps = {
        dir: 'rtl' as const,
        lang: 'ar',
        style: {
            unicodeBidi: 'plaintext' as const,
            textAlign: 'right' as const,
            fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
            fontSize: '18px',
            lineHeight: '1.8',
        },
        placeholder,
        className: `w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`,
        'data-testid': 'arabic-editor',
        autoComplete: 'off',
        autoCorrect: 'off',
        spellCheck: false,
    };

    return (
        <div className="relative">
            {multiline ? (
                <textarea
                    ref={editorRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={handleChange}
                    rows={6}
                    {...rtlProps}
                />
            ) : (
                <input
                    ref={editorRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    {...rtlProps}
                />
            )}

            {/* Auto-save indicator */}
            {autoSave && (
                <div
                    className="absolute bottom-2 left-2 text-xs text-gray-500"
                    data-testid="save-indicator"
                >
                    {isSaving ? (
                        <span>جارٍ الحفظ...</span>
                    ) : lastSaved ? (
                        <span>محفوظ في {lastSaved.toLocaleTimeString('ar-SA')}</span>
                    ) : null}
                </div>
            )}
        </div>
    );
}

/**
 * Mixed Arabic-English Text Editor
 * Handles bidirectional text with automatic direction detection
 */
export function BilingualTextEditor({
    value,
    onChange,
    placeholder = 'Enter text / أدخل النص',
    className = '',
}: ArabicTextEditorProps) {
    const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');

    // Auto-detect direction based on first strong character
    useEffect(() => {
        if (value.length === 0) {
            setDirection('rtl'); // Default to RTL
            return;
        }

        // Check first strong directional character
        const firstArabic = value.search(/[\u0600-\u06FF]/);
        const firstLatin = value.search(/[A-Za-z]/);

        if (firstArabic === -1 && firstLatin !== -1) {
            setDirection('ltr');
        } else if (firstArabic !== -1 && (firstLatin === -1 || firstArabic < firstLatin)) {
            setDirection('rtl');
        }
    }, [value]);

    return (
        <textarea
            dir={direction}
            lang={direction === 'rtl' ? 'ar' : 'en'}
            value={value}
            onChange={(e) => onChange(e.target.value.normalize('NFC'))}
            placeholder={placeholder}
            className={`w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            style={{
                unicodeBidi: 'plaintext',
                textAlign: direction === 'rtl' ? 'right' : 'left',
                fontFamily: direction === 'rtl'
                    ? "'Amiri', 'Noto Naskh Arabic', serif"
                    : "'Inter', sans-serif",
                fontSize: '16px',
                lineHeight: '1.6',
            }}
            data-testid="mixed-editor"
            rows={4}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
        />
    );
}

export default ArabicTextEditor;
