/**
 * Yjs Types for SanadFlow
 * Type definitions for Yjs integration with Supabase Realtime
 * 
 * @module src/types/yjs
 * @agent backend-engineer
 */

import type { Doc as YDoc } from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

/**
 * User presence information broadcast via Supabase Realtime
 */
export interface YjsUserPresence {
    /** Unique user identifier */
    userId: string;
    /** Display name shown in presence indicators */
    displayName: string;
    /** Optional avatar URL */
    avatarUrl?: string;
    /** Cursor color for collaborative editing */
    color: string;
    /** Current cursor position (if applicable) */
    cursor?: {
        anchor: number;
        head: number;
    };
    /** Timestamp of last activity */
    lastActiveAt: number;
}

/**
 * Options for SupabaseProvider initialization
 */
export interface SupabaseProviderOptions {
    /** Room identifier for the collaboration session */
    roomId: string;
    /** Yjs document to sync */
    doc: YDoc;
    /** Optional awareness instance for presence tracking */
    awareness?: Awareness;
    /** Batch interval in milliseconds (default: 100ms) */
    batchInterval?: number;
    /** Maximum reconnection attempts (default: 10) */
    maxReconnectAttempts?: number;
    /** Base delay for reconnection backoff in ms (default: 1000) */
    reconnectBaseDelay?: number;
}

/**
 * Connection status for the Supabase provider
 */
export type SupabaseProviderStatus =
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'reconnecting'
    | 'failed';

/**
 * Event payloads for Supabase Realtime broadcasts
 */
export interface YjsBroadcastPayload {
    /** Yjs update as array of numbers (serializable) */
    update: number[];
    /** Sender's client ID */
    clientId: string;
    /** Timestamp of the update */
    timestamp: number;
}

export interface YjsAwarenessBroadcastPayload {
    /** Awareness update as array of numbers */
    update: number[];
    /** Sender's client ID */
    clientId: string;
}

/**
 * Options for YjsPersistence initialization
 */
export interface YjsPersistenceOptions {
    /** Document ID in the database */
    documentId: string;
    /** Yjs document to persist */
    doc: YDoc;
    /** Auto-save interval in milliseconds (default: 10000ms) */
    saveInterval?: number;
}

/**
 * Yjs document state from database
 */
export interface YjsDocumentState {
    /** Room identifier */
    roomId: string;
    /** Associated workspace ID */
    workspaceId: string;
    /** Associated document ID */
    documentId: string;
    /** Base64 encoded Yjs state */
    state: string;
    /** Last update timestamp */
    updatedAt: string;
}

/**
 * Events emitted by SupabaseProvider
 */
export interface SupabaseProviderEvents {
    /** Fired when connection status changes */
    status: (status: SupabaseProviderStatus) => void;
    /** Fired when synced with remote */
    synced: () => void;
    /** Fired when an error occurs */
    error: (error: Error) => void;
    /** Fired when presence changes */
    presence: (users: YjsUserPresence[]) => void;
}
