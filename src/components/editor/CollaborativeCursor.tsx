/**
 * Collaborative Cursor Component
 * Phase 3 Deliverable (Frontend RTL Integration)
 * 
 * Agent: frontend-engineer
 * Requirements: TDD_v2.0.md Section 5.1 (CollaborativeCursor.tsx)
 */

'use client';

import React, { useEffect, useState } from 'react';

interface CursorData {
    id: string;
    userId: string;
    userName: string;
    color: string;
    x: number;
    y: number;
    lastUpdate: number;
}

interface CollaborativeCursorProps {
    documentId: string;
    currentUserId: string;
    onCursorMove?: (x: number, y: number) => void;
}

// User cursor colors palette
const CURSOR_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#06B6D4', // Cyan
];

export function CollaborativeCursor({
    documentId,
    currentUserId,
    onCursorMove,
}: CollaborativeCursorProps) {
    const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // TODO: Replace with actual Yjs WebSocket connection
        // This is a placeholder for the real-time cursor sync
        const mockWebSocket = {
            onmessage: null as ((event: MessageEvent) => void) | null,
            send: (data: string) => console.log('WS send:', data),
            close: () => console.log('WS close'),
        };

        setIsConnected(true);

        // Track local cursor position
        const handleMouseMove = (e: MouseEvent) => {
            const cursorData = {
                userId: currentUserId,
                x: e.clientX,
                y: e.clientY,
            };

            mockWebSocket.send(JSON.stringify({
                type: 'cursor_move',
                documentId,
                ...cursorData,
            }));

            onCursorMove?.(e.clientX, e.clientY);
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Cleanup stale cursors every 5 seconds
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            setCursors((prev) => {
                const updated = new Map(prev);
                for (const [id, cursor] of updated) {
                    if (now - cursor.lastUpdate > 10000) {
                        updated.delete(id);
                    }
                }
                return updated;
            });
        }, 5000);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearInterval(cleanupInterval);
            mockWebSocket.close();
        };
    }, [documentId, currentUserId, onCursorMove]);

    return (
        <>
            {/* Connection status indicator */}
            <div
                className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full shadow-sm"
                dir="rtl"
            >
                <span
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    aria-hidden="true"
                />
                <span className="text-sm text-gray-600">
                    {isConnected ? 'متصل' : 'غير متصل'}
                </span>
                <span className="text-xs text-gray-400">
                    ({cursors.size} {cursors.size === 1 ? 'مستخدم' : 'مستخدمين'})
                </span>
            </div>

            {/* Remote cursors */}
            {Array.from(cursors.values())
                .filter((cursor) => cursor.userId !== currentUserId)
                .map((cursor) => (
                    <div
                        key={cursor.id}
                        className="fixed pointer-events-none z-40 transition-all duration-75"
                        style={{
                            left: cursor.x,
                            top: cursor.y,
                            transform: 'translate(-2px, -2px)',
                        }}
                    >
                        {/* Cursor arrow */}
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            style={{ color: cursor.color }}
                        >
                            <path
                                d="M3 3L17 10L10 12L8 19L3 3Z"
                                fill="currentColor"
                                stroke="white"
                                strokeWidth="1"
                            />
                        </svg>

                        {/* User name label */}
                        <span
                            className="absolute top-5 left-3 text-xs text-white px-2 py-0.5 rounded whitespace-nowrap"
                            style={{ backgroundColor: cursor.color }}
                            dir="rtl"
                        >
                            {cursor.userName}
                        </span>
                    </div>
                ))}
        </>
    );
}

export default CollaborativeCursor;
