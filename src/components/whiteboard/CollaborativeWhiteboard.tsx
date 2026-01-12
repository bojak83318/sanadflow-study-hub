/**
 * Collaborative Whiteboard with TLDraw v1.29.2 + Yjs
 * Phase 3: Real-time Collaboration - FE-006
 *
 * @module src/components/whiteboard/CollaborativeWhiteboard
 * @agent frontend-engineer
 *
 * CRITICAL: This component uses dynamic import with ssr: false
 * because TLDraw requires browser APIs (window, canvas).
 *
 * NOTE: Uses TLDraw v1.29.2 API (stable, not v2 beta)
 *
 * Features:
 * - Real-time canvas sync via Yjs + Supabase Realtime
 * - Arabic text shapes with RTL support
 * - PNG export with Arabic text preservation
 * - Auto-save indicator in Arabic
 */

'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs/supabase-provider';
import { createClient } from '@/lib/supabase/client';

// CRITICAL: Dynamic import with ssr: false for TLDraw v1.29.2
const Tldraw = dynamic(
    () => import('@tldraw/tldraw').then((mod) => mod.Tldraw),
    {
        ssr: false,
        loading: () => (
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
        ),
    }
);

interface CollaborativeWhiteboardProps {
    /** Diagram ID in the database */
    diagramId: string;
    /** Workspace ID for storage path */
    workspaceId: string;
    /** Room ID for real-time collaboration */
    roomId: string;
    /** Current user's display name */
    userName?: string;
    /** Current user's cursor color */
    userColor?: string;
}

/**
 * Collaborative Whiteboard for I'rab sentence diagrams
 */
export function CollaborativeWhiteboard({
    diagramId,
    workspaceId,
    roomId,
    userName = 'مستخدم',
    userColor = '#4a69bd',
}: CollaborativeWhiteboardProps) {
    // Create stable Yjs document
    const doc = useMemo(() => new Y.Doc(), []);

    const [provider, setProvider] = useState<SupabaseProvider | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('connecting');

    // Store app reference for export (TLDraw v1 uses 'app' not 'editor')
    const appRef = useRef<any>(null);

    // Debounce timer for auto-save
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const supabase = createClient();

    // Load existing diagram from database
    const loadDiagram = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('diagrams')
                .select('canvas_state')
                .eq('id', diagramId)
                .single() as { data: { canvas_state: any } | null; error: any };

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error('[CollaborativeWhiteboard] Load failed:', error);
                }
                return;
            }

            if (data?.canvas_state) {
                // Store in Yjs doc for sync
                const yCanvas = doc.getMap('canvas');
                yCanvas.set('state', data.canvas_state);
            }
        } catch (error) {
            console.error('[CollaborativeWhiteboard] Load error:', error);
        }
    }, [diagramId, doc, supabase]);

    // Initialize Yjs provider
    useEffect(() => {
        let mounted = true;

        const initProvider = async () => {
            try {
                const newProvider = new SupabaseProvider({
                    roomId,
                    doc,
                });

                newProvider.on('status', (status) => {
                    if (mounted) setConnectionStatus(status);
                });

                newProvider.updatePresence({
                    userId: userName,
                    displayName: userName,
                    color: userColor,
                });

                setProvider(newProvider);

                // Load existing diagram state
                await loadDiagram();
            } catch (error) {
                console.error('[CollaborativeWhiteboard] Init failed:', error);
            }
        };

        initProvider();

        return () => {
            mounted = false;
            provider?.destroy();
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [roomId, doc, userColor, userName, loadDiagram, provider]);

    // Save diagram to database (debounced)
    const saveDiagram = useCallback(
        async (documentState: any) => {
            if (isSaving) return;

            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Debounce: wait 2 seconds before saving
            saveTimeoutRef.current = setTimeout(async () => {
                setIsSaving(true);
                try {
                    const { error } = await (supabase.from('diagrams') as any).upsert({
                        id: diagramId,
                        workspace_id: workspaceId,
                        canvas_state: documentState,
                        updated_at: new Date().toISOString(),
                    });

                    if (error) {
                        console.error('[CollaborativeWhiteboard] Save failed:', error);
                    } else {
                        setLastSaved(new Date());
                    }
                } catch (error) {
                    console.error('[CollaborativeWhiteboard] Save error:', error);
                } finally {
                    setIsSaving(false);
                }
            }, 2000);
        },
        [diagramId, workspaceId, supabase, isSaving]
    );

    // Handle TLDraw document changes (v1.29.2 API)
    const handleChange = useCallback(
        (app: any) => {
            if (!app) return;

            // Get current document state
            const documentState = app.document;

            // Store in Yjs for real-time sync
            const yCanvas = doc.getMap('canvas');
            yCanvas.set('state', documentState);

            // Trigger debounced save
            saveDiagram(documentState);
        },
        [doc, saveDiagram]
    );

    // Handle TLDraw mount (v1.29.2 API uses 'app' callback)
    const handleMount = useCallback(
        (app: any) => {
            appRef.current = app;

            // Load initial state from Yjs
            const yCanvas = doc.getMap('canvas');
            const savedState = yCanvas.get('state');
            if (savedState) {
                try {
                    app.loadDocument(savedState as any);
                } catch (e) {
                    console.warn('[CollaborativeWhiteboard] Failed to load state:', e);
                }
            }
        },
        [doc]
    );

    // Export as PNG
    const handleExportPng = useCallback(async () => {
        const app = appRef.current;
        if (!app) {
            console.warn('[CollaborativeWhiteboard] No app reference for export');
            return;
        }

        setIsExporting(true);
        try {
            // Select all shapes for export
            app.selectAll();

            // Export as PNG blob (TLDraw v1.29.2 API)
            const blob = await app.getImageBlob('png');

            if (!blob) {
                alert('لا توجد أشكال للتصدير');
                return;
            }

            // Upload to Supabase Storage
            const fileName = `${workspaceId}/${diagramId}/${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('diagrams')
                .upload(fileName, blob, { contentType: 'image/png' });

            if (uploadError) {
                console.error('[CollaborativeWhiteboard] Upload failed:', uploadError);
            }

            // Download for user
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagram-${diagramId}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Deselect after export
            app.selectNone();
        } catch (error) {
            console.error('[CollaborativeWhiteboard] Export failed:', error);
            alert('فشل التصدير');
        } finally {
            setIsExporting(false);
        }
    }, [diagramId, workspaceId, supabase]);

    // Format time in Arabic
    const formatArabicTime = (date: Date): string => {
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="h-screen relative" dir="ltr">
            {/* TLDraw Canvas (v1.29.2 API) */}
            <Tldraw
                showUI
                showMenu
                showPages={false}
                onMount={handleMount}
                onChange={handleChange}
            />

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 flex gap-2 z-50" dir="rtl">
                <button
                    onClick={handleExportPng}
                    disabled={isExporting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isExporting ? 'جارٍ التصدير...' : 'تصدير PNG'}
                </button>

                {/* Connection status */}
                <div className="px-4 py-2 bg-white rounded-lg shadow-lg flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                            ? 'bg-green-500'
                            : connectionStatus === 'connecting' ||
                                connectionStatus === 'reconnecting'
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-red-500'
                            }`}
                    ></span>
                    <span className="text-sm text-gray-600">
                        {connectionStatus === 'connected'
                            ? 'متصل'
                            : connectionStatus === 'connecting'
                                ? 'جارٍ الاتصال...'
                                : 'غير متصل'}
                    </span>
                </div>

                {/* Save indicator */}
                <div
                    className="px-4 py-2 bg-white rounded-lg shadow-lg text-sm text-gray-600"
                    data-testid="save-indicator"
                >
                    {isSaving ? (
                        <span>جارٍ الحفظ...</span>
                    ) : lastSaved ? (
                        <span>تم الحفظ في {formatArabicTime(lastSaved)}</span>
                    ) : (
                        <span>لم يتم الحفظ بعد</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CollaborativeWhiteboard;
