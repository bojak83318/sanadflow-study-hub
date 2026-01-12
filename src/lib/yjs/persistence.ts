/**
 * Yjs Persistence Layer for SanadFlow
 * Handles saving and loading Yjs document state to/from database
 *
 * @module src/lib/yjs/persistence
 * @agent backend-engineer
 *
 * Features:
 * - Auto-save every 10 seconds (debounced)
 * - Load state on document open
 * - Handle concurrent saves gracefully
 * - Compression support (optional)
 */

import * as Y from 'yjs';
import type { YjsPersistenceOptions } from '@/types/yjs';

/**
 * Persistence layer for Yjs documents
 *
 * @example
 * ```typescript
 * const doc = new Y.Doc();
 * const persistence = new YjsPersistence({
 *   documentId: 'doc-123',
 *   doc,
 *   saveInterval: 10000, // optional, defaults to 10s
 * });
 *
 * // Load existing state
 * await persistence.load();
 *
 * // State auto-saves on document changes
 * // Or manually save immediately:
 * await persistence.saveNow();
 *
 * // Cleanup when done
 * persistence.destroy();
 * ```
 */
export class YjsPersistence {
    private documentId: string;
    private doc: Y.Doc;
    private saveInterval: number;
    private saveTimeout: ReturnType<typeof setTimeout> | null = null;
    private isSaving = false;
    private pendingSave = false;
    private isDestroyed = false;

    // Bound handler for cleanup
    private boundUpdateHandler: () => void;

    // Track last saved state to avoid unnecessary saves
    private lastSavedStateVector: Uint8Array | null = null;

    constructor(options: YjsPersistenceOptions) {
        this.documentId = options.documentId;
        this.doc = options.doc;
        this.saveInterval = options.saveInterval ?? 10000; // Default 10 seconds

        this.boundUpdateHandler = this.scheduleSave.bind(this);
        this.doc.on('update', this.boundUpdateHandler);
    }

    /**
     * Load document state from database
     * @returns Promise that resolves when state is loaded
     */
    async load(): Promise<void> {
        try {
            const response = await fetch(`/api/documents/${this.documentId}/yjs`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // 404 is expected for new documents
                if (response.status === 404) {
                    console.log('[YjsPersistence] No existing state found, starting fresh');
                    return;
                }
                throw new Error(`Failed to load document: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.state) {
                let stateBuffer: Uint8Array;

                // Handle both base64 string and raw array formats
                if (typeof data.state === 'string') {
                    // Base64 encoded
                    stateBuffer = this.base64ToUint8Array(data.state);
                } else if (Array.isArray(data.state)) {
                    // Raw number array
                    stateBuffer = new Uint8Array(data.state);
                } else {
                    throw new Error('Invalid state format');
                }

                Y.applyUpdate(this.doc, stateBuffer, 'persistence');
                this.lastSavedStateVector = Y.encodeStateVector(this.doc);

                console.log('[YjsPersistence] State loaded successfully');
            }
        } catch (error) {
            console.error('[YjsPersistence] Failed to load state:', error);
            throw error;
        }
    }

    /**
     * Save document state immediately
     * @returns Promise that resolves when save is complete
     */
    async saveNow(): Promise<void> {
        // Clear any pending scheduled save
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        await this.save();
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges(): boolean {
        if (!this.lastSavedStateVector) return true;

        const currentStateVector = Y.encodeStateVector(this.doc);
        return !this.arraysEqual(currentStateVector, this.lastSavedStateVector);
    }

    /**
     * Get the last save timestamp (if tracked externally)
     */
    getLastSaveTime(): Date | null {
        return this.lastSaveTime;
    }

    private lastSaveTime: Date | null = null;

    /**
     * Clean up and stop auto-saving
     */
    destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        // Clear scheduled save
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        // Remove listener
        this.doc.off('update', this.boundUpdateHandler);
    }

    // ─────────────────────────────────────────────────────────────
    // Private Methods
    // ─────────────────────────────────────────────────────────────

    private scheduleSave(): void {
        if (this.isDestroyed) return;

        // If currently saving, mark that another save is needed
        if (this.isSaving) {
            this.pendingSave = true;
            return;
        }

        // Debounce: clear existing timeout and schedule new one
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.save().catch((error) => {
                console.error('[YjsPersistence] Auto-save failed:', error);
            });
        }, this.saveInterval);
    }

    private async save(): Promise<void> {
        if (this.isDestroyed) return;
        if (this.isSaving) return;

        // Check if there are actual changes to save
        if (!this.hasUnsavedChanges()) {
            console.log('[YjsPersistence] No changes to save');
            return;
        }

        this.isSaving = true;
        this.saveTimeout = null;

        try {
            const state = Y.encodeStateAsUpdate(this.doc);
            const stateBase64 = this.uint8ArrayToBase64(state);

            const response = await fetch(`/api/documents/${this.documentId}/yjs`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    state: stateBase64,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save document: ${response.statusText}`);
            }

            // Update tracking
            this.lastSavedStateVector = Y.encodeStateVector(this.doc);
            this.lastSaveTime = new Date();

            console.log('[YjsPersistence] State saved successfully at', this.lastSaveTime.toISOString());
        } catch (error) {
            console.error('[YjsPersistence] Save failed:', error);
            throw error;
        } finally {
            this.isSaving = false;

            // If there was a change while saving, schedule another save
            if (this.pendingSave && !this.isDestroyed) {
                this.pendingSave = false;
                this.scheduleSave();
            }
        }
    }

    private uint8ArrayToBase64(data: Uint8Array): string {
        // Browser-compatible base64 encoding
        if (typeof btoa === 'function') {
            const binary = Array.from(data)
                .map((byte) => String.fromCharCode(byte))
                .join('');
            return btoa(binary);
        }

        // Node.js fallback
        return Buffer.from(data).toString('base64');
    }

    private base64ToUint8Array(base64: string): Uint8Array {
        // Browser-compatible base64 decoding
        if (typeof atob === 'function') {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        }

        // Node.js fallback
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }

    private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

export default YjsPersistence;
