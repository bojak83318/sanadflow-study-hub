# Phase 3: Real-time Collaboration - Backend Engineer Stories

> **Agent**: Backend Engineer  
> **Phase**: 3 (Real-time Collaboration)  
> **Timeline**: Week 2 (Jan 20-24, 2026)  
> **Dependencies**: Phase 2 Complete (Database migrations applied)

---

## Story: BE-009 - Supabase Realtime Provider for Yjs

**As a** Backend Engineer  
**I want to** create a custom Yjs provider using Supabase Realtime  
**So that** multiple users can collaborate on documents in real-time

### Acceptance Criteria

- [ ] Custom Yjs provider connects to Supabase Realtime Broadcast
- [ ] 100ms batching to reduce message volume
- [ ] Presence tracking shows online users
- [ ] Reconnection logic with exponential backoff
- [ ] TypeScript types for all provider methods

### Technical Details

**File**: `src/lib/yjs/supabase-provider.ts`

```typescript
import * as Y from 'yjs';
import { createClient } from '@/lib/supabase/client';
import { Awareness } from 'y-protocols/awareness';

interface SupabaseProviderOptions {
  roomId: string;
  doc: Y.Doc;
  awareness?: Awareness;
  batchInterval?: number; // default 100ms
}

export class SupabaseProvider {
  private supabase: ReturnType<typeof createClient>;
  private channel: ReturnType<typeof this.supabase.channel>;
  private doc: Y.Doc;
  private awareness: Awareness;
  private batchInterval: number;
  private pendingUpdates: Uint8Array[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(options: SupabaseProviderOptions) {
    this.supabase = createClient();
    this.doc = options.doc;
    this.awareness = options.awareness || new Awareness(options.doc);
    this.batchInterval = options.batchInterval || 100;
    
    this.channel = this.supabase.channel(`room:${options.roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: 'users' },
      },
    });
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for incoming updates
    this.channel.on('broadcast', { event: 'yjs-update' }, (payload) => {
      const update = new Uint8Array(payload.payload.update);
      Y.applyUpdate(this.doc, update, 'remote');
    });

    // Listen for awareness updates
    this.channel.on('broadcast', { event: 'awareness' }, (payload) => {
      this.awareness.applyUpdate(
        new Uint8Array(payload.payload.update),
        'remote'
      );
    });

    // Track presence
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel.presenceState();
      console.log('Online users:', Object.keys(state).length);
    });

    // Subscribe to local doc changes
    this.doc.on('update', (update: Uint8Array, origin: string) => {
      if (origin !== 'remote') {
        this.queueUpdate(update);
      }
    });

    // Subscribe and sync
    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.syncInitialState();
      }
    });
  }

  private queueUpdate(update: Uint8Array) {
    this.pendingUpdates.push(update);
    
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushUpdates();
      }, this.batchInterval);
    }
  }

  private flushUpdates() {
    if (this.pendingUpdates.length === 0) return;
    
    const mergedUpdate = Y.mergeUpdates(this.pendingUpdates);
    this.channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: { update: Array.from(mergedUpdate) },
    });
    
    this.pendingUpdates = [];
    this.batchTimeout = null;
  }

  private async syncInitialState() {
    // Broadcast current state to sync with other clients
    const state = Y.encodeStateAsUpdate(this.doc);
    this.channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: { update: Array.from(state) },
    });
  }

  public destroy() {
    this.channel.unsubscribe();
    this.doc.off('update', this.queueUpdate);
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
  }
}
```

### Dependencies

```bash
npm install yjs y-protocols
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Supabase Yjs Provider | `src/lib/yjs/supabase-provider.ts` |
| Provider types | `src/types/yjs.d.ts` |

---

## Story: BE-010 - Yjs Persistence Layer

**As a** Backend Engineer  
**I want to** persist Yjs document state to the database  
**So that** users can resume editing where they left off

### Acceptance Criteria

- [ ] Save Yjs state to `yjs_documents` table
- [ ] Auto-save every 10 seconds (debounced)
- [ ] Load state on document open
- [ ] Handle concurrent saves gracefully
- [ ] Compress state before storage (optional)

### Technical Details

**File**: `src/lib/yjs/persistence.ts`

```typescript
import * as Y from 'yjs';
import { createClient } from '@/lib/supabase/server';

interface YjsPersistenceOptions {
  documentId: string;
  doc: Y.Doc;
  saveInterval?: number; // default 10000ms
}

export class YjsPersistence {
  private documentId: string;
  private doc: Y.Doc;
  private saveInterval: number;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSaving = false;
  private pendingSave = false;

  constructor(options: YjsPersistenceOptions) {
    this.documentId = options.documentId;
    this.doc = options.doc;
    this.saveInterval = options.saveInterval || 10000;
    
    this.doc.on('update', () => this.scheduleSave());
  }

  async load(): Promise<void> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('yjs_documents')
      .select('state')
      .eq('document_id', this.documentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to load document: ${error.message}`);
    }

    if (data?.state) {
      const state = new Uint8Array(data.state);
      Y.applyUpdate(this.doc, state, 'persistence');
    }
  }

  private scheduleSave() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => this.save(), this.saveInterval);
  }

  private async save(): Promise<void> {
    if (this.isSaving) return;
    
    this.isSaving = true;
    this.saveTimeout = null;

    try {
      const supabase = createClient();
      const state = Y.encodeStateAsUpdate(this.doc);
      
      const { error } = await supabase
        .from('yjs_documents')
        .upsert({
          document_id: this.documentId,
          state: Array.from(state),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'document_id',
        });

      if (error) {
        throw new Error(`Failed to save document: ${error.message}`);
      }
    } finally {
      this.isSaving = false;
      
      if (this.pendingSave) {
        this.pendingSave = false;
        this.scheduleSave();
      }
    }
  }

  async saveNow(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.save();
  }

  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.doc.off('update', this.scheduleSave);
  }
}
```

**API Route**: `src/app/api/documents/[id]/yjs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('yjs_documents')
    .select('state, updated_at')
    .eq('document_id', params.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { state: null });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { error } = await supabase
    .from('yjs_documents')
    .upsert({
      document_id: params.id,
      state: body.state,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'document_id',
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Yjs Persistence | `src/lib/yjs/persistence.ts` |
| API Route | `src/app/api/documents/[id]/yjs/route.ts` |

---

## Exit Criteria

Before handing off to Frontend Engineer:

- [ ] SupabaseProvider connects and syncs between 2 browser tabs
- [ ] Persistence saves to `yjs_documents` table
- [ ] Load retrieves previous document state
- [ ] No duplicate updates sent (batching works)
- [ ] Presence shows online user count

---

## Handoff to Frontend Engineer

```markdown
## HANDOFF: BACKEND → FRONTEND

**Status**: ✅ Yjs Infrastructure Ready
**Date**: [DATE]

### Available:
- `SupabaseProvider` for real-time sync
- `YjsPersistence` for auto-save
- API route for manual save/load

### Usage Example:
\`\`\`typescript
const doc = new Y.Doc();
const provider = new SupabaseProvider({ roomId, doc });
const persistence = new YjsPersistence({ documentId, doc });
await persistence.load();
\`\`\`

### Next Steps for Frontend:
1. Integrate with Tiptap editor
2. Integrate with TLDraw
3. Show presence indicators
```
