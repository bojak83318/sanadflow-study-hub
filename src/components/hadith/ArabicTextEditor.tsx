'use client';

import React, { useEffect, useRef } from 'react';

interface ArabicTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    multiline?: boolean;
    autoSave?: boolean;
    onSave?: (value: string) => void | Promise<void>;
}

export function ArabicTextEditor({
    value,
    onChange,
    placeholder = 'أدخل النص العربي هنا...',
    className = '',
    rows = 4,
    multiline = true,
    autoSave = false,
    onSave
}: ArabicTextEditorProps) {
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (autoSave && onSave && value) {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                onSave(value);
            }, 2000); // 2 second debounce
        }
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [value, autoSave, onSave]);

    return (
        <textarea
            dir="rtl"
            lang="ar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full p-3 border border-gray-300 rounded-lg font-arabic text-lg leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
            style={{
                unicodeBidi: 'plaintext',
                textAlign: 'right',
                fontFamily: 'Amiri, serif'
            }}
            rows={rows}
        />
    );
}

interface BilingualTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function BilingualTextEditor({
    value,
    onChange,
    placeholder = 'Enter text...'
}: BilingualTextEditorProps) {
    return (
        <textarea
            dir="ltr"
            lang="en"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
        />
    );
}
