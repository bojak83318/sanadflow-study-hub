/**
 * Yjs Integration Module
 * Exports Supabase Realtime provider and persistence layer
 *
 * @module src/lib/yjs
 * @agent backend-engineer
 */

export { SupabaseProvider, default as SupabaseProviderDefault } from './supabase-provider';
export { YjsPersistence, default as YjsPersistenceDefault } from './persistence';

// Re-export types for convenience
export type {
    SupabaseProviderOptions,
    SupabaseProviderStatus,
    YjsUserPresence,
    YjsPersistenceOptions,
    YjsDocumentState,
    SupabaseProviderEvents,
} from '@/types/yjs';
