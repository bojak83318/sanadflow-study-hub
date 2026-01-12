/**
 * Collaborative Rich Text Editor with Tiptap + Yjs
 * Phase 3: Real-time Collaboration - FE-005
 *
 * @module src/components/editor/CollaborativeEditor
 * @agent frontend-engineer
 *
 * Features:
 * - Real-time collaboration via Yjs + Supabase Realtime
 * - RTL Arabic support with mandatory attributes
 * - Unicode NFC normalization
 * - Cursor presence showing other users
 * - Auto-save indicator in Arabic
 */

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useEffect, useState, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs/supabase-provider';
import { YjsPersistence } from '@/lib/yjs/persistence';

interface CollaborativeEditorProps {
    /** Document ID for persistence */
    documentId: string;
    /** Room ID for real-time collaboration */
    roomId: string;
    /** Current user's display name */
    userName: string;
    /** Current user's cursor color (hex) */
    userColor: string;
    /** Placeholder text (Arabic) */
    placeholder?: string;
    /** Callback when content changes */
    onChange?: (content: string) => void;
}

/**
 * Collaborative Rich Text Editor with RTL Arabic Support
 */
export function CollaborativeEditor({
    documentId,
    roomId,
    userName,
    userColor,
    placeholder = 'ابدأ الكتابة هنا...',
    onChange,
}: CollaborativeEditorProps) {
    // Create stable Yjs document
    const doc = useMemo(() => new Y.Doc(), []);

    const [provider, setProvider] = useState<SupabaseProvider | null>(null);
    const [persistence, setPersistence] = useState<YjsPersistence | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    // Initialize Yjs provider and persistence
    useEffect(() => {
        let mounted = true;

        const initYjs = async () => {
            try {
                // Initialize persistence layer
                const newPersistence = new YjsPersistence({ documentId, doc });
                await newPersistence.load();

                if (!mounted) return;
                setPersistence(newPersistence);

                // Initialize real-time provider
                const newProvider = new SupabaseProvider({
                    roomId,
                    doc,
                });

                // Track connection status
                newProvider.on('status', (status) => {
                    if (mounted) setConnectionStatus(status);
                });

                // Track online users
                newProvider.on('presence', (users) => {
                    if (mounted) {
                        setOnlineUsers(users.map((u) => u.displayName || 'مستخدم'));
                    }
                });

                // Update presence with user info
                newProvider.updatePresence({
                    userId: userName,
                    displayName: userName,
                    color: userColor,
                });

                setProvider(newProvider);
                setIsLoading(false);
            } catch (error) {
                console.error('[CollaborativeEditor] Failed to initialize:', error);
                if (mounted) setIsLoading(false);
            }
        };

        initYjs();

        return () => {
            mounted = false;
            provider?.destroy();
            persistence?.destroy();
        };
    }, [documentId, roomId, doc, userColor, userName, persistence, provider]);

    // Track save events from persistence
    useEffect(() => {
        if (!persistence) return;

        const checkSaveStatus = setInterval(() => {
            const saveTime = persistence.getLastSaveTime();
            if (saveTime && saveTime !== lastSaved) {
                setLastSaved(saveTime);
            }
        }, 1000);

        return () => clearInterval(checkSaveStatus);
    }, [persistence, lastSaved]);

    // Normalize content to NFC
    const normalizeContent = useCallback((html: string): string => {
        return html.normalize('NFC');
    }, []);

    // Create Tiptap editor with Yjs extensions
    const editor = useEditor(
        {
            extensions: [
                StarterKit.configure({
                    history: false, // Yjs handles undo/redo
                }),
                Collaboration.configure({
                    document: doc,
                }),
                ...(provider
                    ? [
                        CollaborationCursor.configure({
                            provider: provider as any,
                            user: {
                                name: userName,
                                color: userColor,
                            },
                        }),
                    ]
                    : []),
            ],
            editorProps: {
                attributes: {
                    dir: 'rtl',
                    lang: 'ar',
                    class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
                    style: "unicode-bidi: plaintext; text-align: right; font-family: 'Amiri', 'Noto Naskh Arabic', serif;",
                },
            },
            onUpdate: ({ editor }) => {
                // Get HTML content
                const html = editor.getHTML();

                // Normalize to NFC for Arabic text
                const normalized = normalizeContent(html);

                // If normalization changed content, update silently
                if (html !== normalized) {
                    editor.commands.setContent(normalized, false);
                }

                // Notify parent of changes
                onChange?.(normalized);
            },
        },
        [provider, doc]
    );

    // Format time in Arabic
    const formatArabicTime = (date: Date): string => {
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div
                className="flex items-center justify-center h-64 bg-gray-50 rounded-lg"
                dir="rtl"
                lang="ar"
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-500">جارٍ تحميل المستند...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden" dir="rtl" lang="ar">
            {/* Toolbar */}
            <div className="bg-gray-50 p-2 border-b flex justify-between items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        disabled={!editor}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${editor?.isActive('bold')
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-200'
                            }`}
                        title="غامق"
                    >
                        <strong>غ</strong>
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        disabled={!editor}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${editor?.isActive('italic')
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-200'
                            }`}
                        title="مائل"
                    >
                        <em>م</em>
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        disabled={!editor}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${editor?.isActive('bulletList')
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-200'
                            }`}
                        title="قائمة نقطية"
                    >
                        •
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        disabled={!editor}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${editor?.isActive('orderedList')
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-200'
                            }`}
                        title="قائمة مرقمة"
                    >
                        ١.
                    </button>
                    <div className="border-r border-gray-300 mx-2"></div>
                    <button
                        onClick={() => editor?.chain().focus().undo().run()}
                        disabled={!editor?.can().undo()}
                        className="px-3 py-1.5 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                        title="تراجع"
                    >
                        ↶
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().redo().run()}
                        disabled={!editor?.can().redo()}
                        className="px-3 py-1.5 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                        title="إعادة"
                    >
                        ↷
                    </button>
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    {/* Online users */}
                    {onlineUsers.length > 0 && (
                        <div className="flex items-center gap-1">
                            <span
                                className="w-2 h-2 rounded-full bg-green-500"
                                aria-hidden="true"
                            ></span>
                            <span>{onlineUsers.length} متصل</span>
                        </div>
                    )}

                    {/* Connection status */}
                    <div className="flex items-center gap-1">
                        <span
                            className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                                ? 'bg-green-500'
                                : connectionStatus === 'connecting' ||
                                    connectionStatus === 'reconnecting'
                                    ? 'bg-yellow-500 animate-pulse'
                                    : 'bg-red-500'
                                }`}
                            aria-hidden="true"
                        ></span>
                        <span>
                            {connectionStatus === 'connected'
                                ? 'متصل'
                                : connectionStatus === 'connecting'
                                    ? 'جارٍ الاتصال...'
                                    : connectionStatus === 'reconnecting'
                                        ? 'إعادة الاتصال...'
                                        : 'غير متصل'}
                        </span>
                    </div>

                    {/* Save indicator */}
                    <div data-testid="save-indicator">
                        {lastSaved ? (
                            <span>تم الحفظ في {formatArabicTime(lastSaved)}</span>
                        ) : (
                            <span>جارٍ الحفظ...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div
                className="bg-white"
                style={{
                    unicodeBidi: 'plaintext',
                    textAlign: 'right',
                }}
            >
                <EditorContent editor={editor} />
            </div>

            {/* Placeholder when empty */}
            {editor?.isEmpty && (
                <div
                    className="absolute top-1/2 right-4 text-gray-400 pointer-events-none"
                    style={{
                        unicodeBidi: 'plaintext',
                        textAlign: 'right',
                    }}
                >
                    {placeholder}
                </div>
            )}
        </div>
    );
}

export default CollaborativeEditor;
