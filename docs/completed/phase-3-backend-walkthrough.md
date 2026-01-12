# Phase 3: Real-time Collaboration - Implementation Walkthrough

**Status**: ✅ Backend Implementation Complete  
**Date**: 2026-01-12  
**Stories**: BE-009 (Supabase Realtime Provider), BE-010 (Yjs Persistence)

---

## Summary

Implemented real-time collaboration infrastructure for SanadFlow using Yjs CRDT with Supabase Realtime Broadcast API. This enables:

- **Conflict-free editing**: Multiple users can edit simultaneously
- **100ms batched updates**: Reduces message volume for better performance
- **Presence tracking**: Show online users with cursor positions
- **Persistent state**: Auto-save every 10 seconds to database
- **Reconnection**: Exponential backoff for reliable connections

---

## Deliverables

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Supabase Provider | [supabase-provider.ts](file:///home/kasm-user/workspace/dspy/qalamcolab/src/lib/yjs/supabase-provider.ts) | Real-time sync via Supabase Broadcast |
| Persistence Layer | [persistence.ts](file:///home/kasm-user/workspace/dspy/qalamcolab/src/lib/yjs/persistence.ts) | Auto-save with debouncing |
| API Route | [route.ts](file:///home/kasm-user/workspace/dspy/qalamcolab/src/app/api/documents/%5Bid%5D/yjs/route.ts) | GET/PUT for Yjs state |
| Type Definitions | [yjs.d.ts](file:///home/kasm-user/workspace/dspy/qalamcolab/src/types/yjs.d.ts) | TypeScript types |
| Module Index | [index.ts](file:///home/kasm-user/workspace/dspy/qalamcolab/src/lib/yjs/index.ts) | Convenience exports |

---

## HANDOFF: BACKEND → FRONTEND

### Available Components

```typescript
import { SupabaseProvider, YjsPersistence } from '@/lib/yjs';
```

### Usage Example

```typescript
import * as Y from 'yjs';
import { SupabaseProvider, YjsPersistence } from '@/lib/yjs';

// 1. Create Yjs document
const doc = new Y.Doc();

// 2. Set up real-time sync
const provider = new SupabaseProvider({
  roomId: 'document-123',
  doc,
  batchInterval: 100, // ms (default)
});

// 3. Set up persistence
const persistence = new YjsPersistence({
  documentId: 'document-123',
  doc,
  saveInterval: 10000, // ms (default)
});

// 4. Load existing state
await persistence.load();

// 5. Listen for events
provider.on('status', (status) => {
  console.log('Connection:', status);
  // 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed'
});

provider.on('presence', (users) => {
  console.log('Online users:', users.length);
});

provider.on('synced', () => {
  console.log('Synced with remote!');
});

// 6. Update presence
await provider.updatePresence({
  userId: 'user-abc',
  displayName: 'Ahmed',
  color: '#3B82F6',
  cursor: { anchor: 10, head: 15 },
});

// 7. Cleanup on unmount
provider.destroy();
persistence.destroy();
```

### Tiptap Integration Example

```typescript
import { useEditor } from '@tiptap/react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

const doc = new Y.Doc();
const provider = new SupabaseProvider({ roomId, doc });

const editor = useEditor({
  extensions: [
    StarterKit.configure({ history: false }), // Disable default history
    Collaboration.configure({ document: doc }),
    CollaborationCursor.configure({
      provider: provider as unknown as any, // Adapt if needed
      user: { name: 'Ahmed', color: '#3B82F6' },
    }),
  ],
});
```

### TLDraw Integration Example

```typescript
import { Tldraw, useValue } from '@tldraw/tldraw';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs';

export function CollaborativeWhiteboard({ roomId }: { roomId: string }) {
  const doc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () => new SupabaseProvider({ roomId, doc }),
    [roomId, doc]
  );
  
  return (
    <Tldraw
      yjs:doc={doc} // TLDraw Yjs integration
      onMount={(editor) => {
        // Custom setup
      }}
    />
  );
}
```

---

## API Reference

### GET /api/documents/[id]/yjs

Load existing Yjs state for a document.

**Response** (200 OK):
```json
{
  "state": "base64-encoded-yjs-state",
  "updatedAt": "2026-01-12T12:00:00.000Z"
}
```

**Response** (new document):
```json
{
  "state": null,
  "updatedAt": null
}
```

### PUT /api/documents/[id]/yjs

Save Yjs state to database.

**Request Body**:
```json
{
  "state": "base64-encoded-yjs-state"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "updatedAt": "2026-01-12T12:00:00.000Z"
}
```

---

## Known Limitations

1. **Initial Sync**: On first connection, the provider broadcasts its current state. For large documents, consider implementing a state vector exchange for more efficient syncing.

2. **Offline Support**: Currently no offline queue. If disconnected, local edits won't sync until reconnection.

3. **Type Assertion**: The `yjs_documents` upsert uses a type assertion due to Supabase type generation limitations. This is safe but not ideal.

4. **Presence Cleanup**: Supabase Realtime automatically removes presence when clients disconnect, but there may be a slight delay.

---

## Next Steps for Frontend

1. **Integrate with Tiptap editor** for rich text editing
2. **Integrate with TLDraw** for whiteboard diagrams
3. **Show presence indicators** (colored cursors, user avatars)
4. **Add save indicator** showing "Saved at HH:MM"
5. **Test multi-tab sync** to verify batching works correctly

---

## Verification Commands

```bash
# TypeScript check
npx tsc --noEmit

# Build verification
npm run build

# Start dev server for testing
npm run dev
```
