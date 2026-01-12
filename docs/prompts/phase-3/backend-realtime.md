# AGENT DISPATCH: Backend Engineer (Phase 3)

> **Phase**: 3 - Real-time Collaboration  
> **Agent**: Backend Engineer  
> **Date**: January 12, 2026  
> **Status**: Ready to Execute

---

## Persona Activation

You are a **Senior Backend Engineer** for QalamColab. Your adapter profile (`skills/backend-engineer/adapter.md`):

> Backend Engineer for SanadFlow GraphQL API, Prisma ORM, and real-time collaboration. Specialized in Yjs CRDT persistence and Supabase Realtime integration.

**Read and internalize**: `skills/backend-engineer/SKILL.md`

---

## Current Assignment

**Phase**: 3 - Real-time Collaboration  
**Story File**: `stories/backend/PHASE-3-REALTIME.md`  
**Dependencies**: Phase 2 complete (database migrations applied, 10 tables, RLS active)

---

## Task Summary

### BE-009: Supabase Realtime Provider for Yjs

Create a custom Yjs provider using Supabase Realtime Broadcast API:

1. **Create** `src/lib/yjs/supabase-provider.ts`
   - Connect to Supabase Realtime channel
   - Broadcast Yjs updates to all connected clients
   - 100ms batching to reduce message volume
   - Presence tracking for online users

2. **Key Implementation Details**:
   ```typescript
   // Channel setup
   const channel = supabase.channel(`room:${roomId}`, {
     config: {
       broadcast: { self: false },
       presence: { key: 'users' },
     },
   });
   
   // Merge and batch updates
   const mergedUpdate = Y.mergeUpdates(pendingUpdates);
   ```

### BE-010: Yjs Persistence Layer

Create persistence layer to save Yjs state to database:

1. **Create** `src/lib/yjs/persistence.ts`
   - Load state from `yjs_documents` table on doc open
   - Auto-save every 10 seconds (debounced)
   - Handle concurrent saves gracefully

2. **Create** `src/app/api/documents/[id]/yjs/route.ts`
   - GET: Load Yjs state
   - PUT: Save Yjs state

---

## Technical Reference

### Database Table (already created)

```sql
-- From 001_init_schema.sql
CREATE TABLE yjs_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id),
  state BYTEA,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase Realtime Channel Pattern

```typescript
const channel = supabase.channel('room:' + roomId);

channel.on('broadcast', { event: 'yjs-update' }, (payload) => {
  Y.applyUpdate(doc, new Uint8Array(payload.update));
});

channel.subscribe();
```

---

## Dependencies to Install

```bash
npm install yjs y-protocols
```

---

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Supabase Yjs Provider | `src/lib/yjs/supabase-provider.ts` |
| Yjs Persistence | `src/lib/yjs/persistence.ts` |
| API Route | `src/app/api/documents/[id]/yjs/route.ts` |
| Types | `src/types/yjs.d.ts` |

---

## Exit Criteria

- [ ] Provider connects and syncs between 2 browser tabs
- [ ] Persistence saves to `yjs_documents` table
- [ ] Load retrieves previous document state
- [ ] No duplicate updates (batching works)
- [ ] Presence shows online user count

---

## Handoff

Upon completion, signal handoff to **Frontend Engineer** with:
- Usage example for SupabaseProvider
- Usage example for YjsPersistence
- Any API limitations discovered

---

**BEGIN EXECUTION.**
