/**
 * Supabase Realtime Provider for Yjs
 * Custom Yjs provider using Supabase Realtime Broadcast API
 *
 * @module src/lib/yjs/supabase-provider
 * @agent backend-engineer
 *
 * Features:
 * - Real-time document sync via Supabase Broadcast
 * - 100ms batching to reduce message volume
 * - Presence tracking for online users
 * - Reconnection with exponential backoff
 * - TypeScript types for all methods
 */

import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { createClient } from '@/lib/supabase/client';
import type {
    SupabaseProviderOptions,
    SupabaseProviderStatus,
    YjsUserPresence,
    YjsBroadcastPayload,
    YjsAwarenessBroadcastPayload,
} from '@/types/yjs';

type RealtimeChannel = ReturnType<ReturnType<typeof createClient>['channel']>;

/**
 * Custom Yjs provider for Supabase Realtime
 *
 * @example
 * ```typescript
 * const doc = new Y.Doc();
 * const provider = new SupabaseProvider({
 *   roomId: 'document-123',
 *   doc,
 *   batchInterval: 100, // optional
 * });
 *
 * // Listen for status changes
 * provider.on('status', (status) => console.log('Status:', status));
 *
 * // Get online users
 * provider.on('presence', (users) => console.log('Online:', users));
 *
 * // Cleanup when done
 * provider.destroy();
 * ```
 */
export class SupabaseProvider {
    private supabase: ReturnType<typeof createClient>;
    private channel: RealtimeChannel;
    private doc: Y.Doc;
    private awareness: Awareness;
    private roomId: string;

    // Batching configuration
    private batchInterval: number;
    private pendingUpdates: Uint8Array[] = [];
    private batchTimeout: ReturnType<typeof setTimeout> | null = null;

    // Reconnection configuration
    private maxReconnectAttempts: number;
    private reconnectBaseDelay: number;
    private reconnectAttempts = 0;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    // State tracking
    private _status: SupabaseProviderStatus = 'disconnected';
    private _synced = false;
    private _destroyed = false;
    private clientId: string;

    // Event listeners
    private statusListeners: Set<(status: SupabaseProviderStatus) => void> = new Set();
    private syncedListeners: Set<() => void> = new Set();
    private errorListeners: Set<(error: Error) => void> = new Set();
    private presenceListeners: Set<(users: YjsUserPresence[]) => void> = new Set();

    // Bound handlers for cleanup
    private boundDocUpdateHandler: (update: Uint8Array, origin: unknown) => void;
    private boundAwarenessUpdateHandler: (
        changes: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown
    ) => void;

    constructor(options: SupabaseProviderOptions) {
        this.supabase = createClient();
        this.doc = options.doc;
        this.roomId = options.roomId;
        this.awareness = options.awareness || new Awareness(this.doc);
        this.batchInterval = options.batchInterval ?? 100;
        this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
        this.reconnectBaseDelay = options.reconnectBaseDelay ?? 1000;

        // Generate unique client ID
        this.clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Create channel with broadcast and presence configuration
        this.channel = this.supabase.channel(`room:${this.roomId}`, {
            config: {
                broadcast: { self: false }, // Don't receive own broadcasts
                presence: { key: this.clientId },
            },
        });

        // Bind handlers for proper cleanup
        this.boundDocUpdateHandler = this.handleDocUpdate.bind(this);
        this.boundAwarenessUpdateHandler = this.handleAwarenessUpdate.bind(this);

        this.setupListeners();
        this.connect();
    }

    /**
     * Current connection status
     */
    get status(): SupabaseProviderStatus {
        return this._status;
    }

    /**
     * Whether the provider has synced with remote
     */
    get synced(): boolean {
        return this._synced;
    }

    /**
     * Get current online users from presence
     */
    getOnlineUsers(): YjsUserPresence[] {
        const presenceState = this.channel.presenceState<YjsUserPresence>();
        return Object.values(presenceState).flat();
    }

    /**
     * Update local user's presence information
     */
    async updatePresence(presence: Partial<YjsUserPresence>): Promise<void> {
        if (this._status !== 'connected') return;

        try {
            await this.channel.track({
                ...presence,
                lastActiveAt: Date.now(),
            });
        } catch (error) {
            this.emitError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Register event listener
     */
    on<E extends keyof {
        status: SupabaseProviderStatus;
        synced: void;
        error: Error;
        presence: YjsUserPresence[];
    }>(
        event: E,
        callback: E extends 'status'
            ? (status: SupabaseProviderStatus) => void
            : E extends 'synced'
            ? () => void
            : E extends 'error'
            ? (error: Error) => void
            : (users: YjsUserPresence[]) => void
    ): void {
        switch (event) {
            case 'status':
                this.statusListeners.add(callback as (status: SupabaseProviderStatus) => void);
                break;
            case 'synced':
                this.syncedListeners.add(callback as () => void);
                break;
            case 'error':
                this.errorListeners.add(callback as (error: Error) => void);
                break;
            case 'presence':
                this.presenceListeners.add(callback as (users: YjsUserPresence[]) => void);
                break;
        }
    }

    /**
     * Remove event listener
     */
    off<E extends keyof {
        status: SupabaseProviderStatus;
        synced: void;
        error: Error;
        presence: YjsUserPresence[];
    }>(
        event: E,
        callback: E extends 'status'
            ? (status: SupabaseProviderStatus) => void
            : E extends 'synced'
            ? () => void
            : E extends 'error'
            ? (error: Error) => void
            : (users: YjsUserPresence[]) => void
    ): void {
        switch (event) {
            case 'status':
                this.statusListeners.delete(callback as (status: SupabaseProviderStatus) => void);
                break;
            case 'synced':
                this.syncedListeners.delete(callback as () => void);
                break;
            case 'error':
                this.errorListeners.delete(callback as (error: Error) => void);
                break;
            case 'presence':
                this.presenceListeners.delete(callback as (users: YjsUserPresence[]) => void);
                break;
        }
    }

    /**
     * Force flush pending updates
     */
    flushUpdates(): void {
        this.flushPendingUpdates();
    }

    /**
     * Manually reconnect
     */
    reconnect(): void {
        if (this._destroyed) return;
        this.reconnectAttempts = 0;
        this.connect();
    }

    /**
     * Clean up and disconnect
     */
    destroy(): void {
        if (this._destroyed) return;
        this._destroyed = true;

        // Clear timeouts
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Flush any pending updates before disconnecting
        this.flushPendingUpdates();

        // Remove doc listeners
        this.doc.off('update', this.boundDocUpdateHandler);
        this.awareness.off('update', this.boundAwarenessUpdateHandler);

        // Unsubscribe from channel
        this.channel.unsubscribe();

        // Clear listeners
        this.statusListeners.clear();
        this.syncedListeners.clear();
        this.errorListeners.clear();
        this.presenceListeners.clear();

        this.setStatus('disconnected');
    }

    // ─────────────────────────────────────────────────────────────
    // Private Methods
    // ─────────────────────────────────────────────────────────────

    private setupListeners(): void {
        // Listen for incoming Yjs updates
        this.channel.on('broadcast', { event: 'yjs-update' }, (payload) => {
            try {
                const data = payload.payload as YjsBroadcastPayload;
                // Skip if from self (redundant with self: false, but defensive)
                if (data.clientId === this.clientId) return;

                const update = new Uint8Array(data.update);
                Y.applyUpdate(this.doc, update, 'remote');
            } catch (error) {
                console.error('[SupabaseProvider] Failed to apply update:', error);
                this.emitError(error instanceof Error ? error : new Error(String(error)));
            }
        });

        // Listen for awareness updates
        this.channel.on('broadcast', { event: 'awareness' }, (payload) => {
            try {
                const data = payload.payload as YjsAwarenessBroadcastPayload;
                if (data.clientId === this.clientId) return;

                const update = new Uint8Array(data.update);
                applyAwarenessUpdate(this.awareness, update, 'remote');
            } catch (error) {
                console.error('[SupabaseProvider] Failed to apply awareness update:', error);
            }
        });

        // Track presence changes
        this.channel.on('presence', { event: 'sync' }, () => {
            this.emitPresence();
        });

        this.channel.on('presence', { event: 'join' }, () => {
            this.emitPresence();
        });

        this.channel.on('presence', { event: 'leave' }, () => {
            this.emitPresence();
        });

        // Subscribe to local doc changes
        this.doc.on('update', this.boundDocUpdateHandler);

        // Subscribe to local awareness changes
        this.awareness.on('update', this.boundAwarenessUpdateHandler);
    }

    private handleDocUpdate(update: Uint8Array, origin: unknown): void {
        // Only broadcast local changes
        if (origin === 'remote' || origin === 'persistence') return;
        if (this._status !== 'connected') return;

        this.queueUpdate(update);
    }

    private handleAwarenessUpdate(
        changes: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown
    ): void {
        if (origin === 'remote') return;
        if (this._status !== 'connected') return;

        const changedClients = [...changes.added, ...changes.updated, ...changes.removed];
        if (changedClients.length === 0) return;

        const awarenessUpdate = encodeAwarenessUpdate(this.awareness, changedClients);

        const payload: YjsAwarenessBroadcastPayload = {
            update: Array.from(awarenessUpdate),
            clientId: this.clientId,
        };

        this.channel.send({
            type: 'broadcast',
            event: 'awareness',
            payload,
        });
    }

    private queueUpdate(update: Uint8Array): void {
        this.pendingUpdates.push(update);

        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.flushPendingUpdates();
            }, this.batchInterval);
        }
    }

    private flushPendingUpdates(): void {
        if (this.pendingUpdates.length === 0) return;
        if (this._status !== 'connected') return;

        try {
            // Merge all pending updates into one
            const mergedUpdate = Y.mergeUpdates(this.pendingUpdates);

            const payload: YjsBroadcastPayload = {
                update: Array.from(mergedUpdate),
                clientId: this.clientId,
                timestamp: Date.now(),
            };

            this.channel.send({
                type: 'broadcast',
                event: 'yjs-update',
                payload,
            });
        } catch (error) {
            console.error('[SupabaseProvider] Failed to send update:', error);
            this.emitError(error instanceof Error ? error : new Error(String(error)));
        } finally {
            this.pendingUpdates = [];
            this.batchTimeout = null;
        }
    }

    private connect(): void {
        if (this._destroyed) return;

        this.setStatus('connecting');

        this.channel.subscribe(async (status) => {
            if (this._destroyed) return;

            if (status === 'SUBSCRIBED') {
                this.reconnectAttempts = 0;
                this.setStatus('connected');

                // Sync initial state
                await this.syncInitialState();
                this._synced = true;
                this.emitSynced();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                this.handleConnectionError();
            } else if (status === 'CLOSED') {
                this.setStatus('disconnected');
            }
        });
    }

    private async syncInitialState(): Promise<void> {
        // Broadcast current state vector to help others sync
        const stateVector = Y.encodeStateVector(this.doc);
        const clientStates = this.awareness.getStates();

        // Request sync from others by broadcasting state vector
        this.channel.send({
            type: 'broadcast',
            event: 'sync-request',
            payload: {
                stateVector: Array.from(stateVector),
                clientId: this.clientId,
            },
        });

        // Broadcast current awareness
        if (clientStates.size > 0) {
            const awarenessUpdate = encodeAwarenessUpdate(
                this.awareness,
                Array.from(clientStates.keys())
            );
            this.channel.send({
                type: 'broadcast',
                event: 'awareness',
                payload: {
                    update: Array.from(awarenessUpdate),
                    clientId: this.clientId,
                } as YjsAwarenessBroadcastPayload,
            });
        }
    }

    private handleConnectionError(): void {
        if (this._destroyed) return;

        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            this.setStatus('failed');
            this.emitError(new Error('Max reconnection attempts reached'));
            return;
        }

        this.setStatus('reconnecting');

        // Exponential backoff with jitter
        const delay = Math.min(
            this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
            30000 // Max 30 seconds
        );
        const jitter = Math.random() * 1000;

        console.log(
            `[SupabaseProvider] Reconnecting in ${Math.round(delay + jitter)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        this.reconnectTimeout = setTimeout(() => {
            if (!this._destroyed) {
                this.channel.unsubscribe();
                this.channel = this.supabase.channel(`room:${this.roomId}`, {
                    config: {
                        broadcast: { self: false },
                        presence: { key: this.clientId },
                    },
                });
                this.setupListeners();
                this.connect();
            }
        }, delay + jitter);
    }

    private setStatus(status: SupabaseProviderStatus): void {
        if (this._status === status) return;
        this._status = status;
        this.statusListeners.forEach((cb) => cb(status));
    }

    private emitSynced(): void {
        this.syncedListeners.forEach((cb) => cb());
    }

    private emitError(error: Error): void {
        this.errorListeners.forEach((cb) => cb(error));
    }

    private emitPresence(): void {
        const users = this.getOnlineUsers();
        this.presenceListeners.forEach((cb) => cb(users));
    }
}

export default SupabaseProvider;
