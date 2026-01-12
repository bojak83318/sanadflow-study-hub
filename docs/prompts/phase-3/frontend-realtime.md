# AGENT DISPATCH: Frontend Engineer (Phase 3)

> **Phase**: 3 - Real-time Collaboration  
> **Agent**: Frontend Engineer  
> **Date**: January 12, 2026  
> **Status**: Ready to Execute (after BE-009, BE-010)

---

## Persona Activation

You are a **Senior Frontend Engineer** for QalamColab. Your adapter profile (`skills/frontend-engineer/adapter.md`):

> Frontend Engineer for SanadFlow React/Next.js UI with Arabic RTL support and TLDraw whiteboard.

**Read and internalize**: `skills/frontend-engineer/SKILL.md`

---

## ⚠️ MANDATORY RTL Requirements

**Every Arabic text element MUST include ALL of the following:**

1. `dir="rtl"` - Direction attribute
2. `lang="ar"` - Language attribute
3. `unicode-bidi: plaintext` - CSS property
4. `text-align: right` - Text alignment

```tsx
// ✅ CORRECT
<div dir="rtl" lang="ar" style={{ unicodeBidi: 'plaintext', textAlign: 'right' }}>
  {arabicText}
</div>

// ❌ INCORRECT - Missing RTL requirements
<div>{arabicText}</div>
```

---

## Current Assignment

**Phase**: 3 - Real-time Collaboration  
**Story File**: `stories/frontend/PHASE-3-REALTIME.md`  
**Dependencies**: BE-009, BE-010 complete (Yjs provider and persistence ready)

---

## Task Summary

### FE-005: Collaborative Rich Text Editor

Create a Tiptap editor integrated with Yjs:

1. **Create** `src/components/editor/CollaborativeEditor.tsx`
   - Tiptap with `@tiptap/extension-collaboration`
   - RTL support with `dir="rtl"` and `lang="ar"`
   - Unicode NFC normalization on all inputs
   - Cursor presence showing other users
   - Auto-save indicator in Arabic ("تم الحفظ في")

2. **Dependencies**:
   ```bash
   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
   ```

### FE-006: TLDraw Whiteboard

Integrate TLDraw v1.29.2 for I'rab diagrams:

1. **Create** `src/components/whiteboard/CollaborativeWhiteboard.tsx`
   - Dynamic import with `ssr: false` (CRITICAL)
   - Canvas state synced via Yjs
   - PNG export preserves Arabic text
   - Auto-save to `diagrams` table

2. **Create** `src/app/workspace/[slug]/whiteboard/[id]/page.tsx`

3. **Dependencies**:
   ```bash
   npm install @tldraw/tldraw@1.29.2
   ```

### FE-007: Hadith Entry Form

Create hadith cataloging form:

1. **Create** `src/components/hadith/HadithForm.tsx`
   - Arabic text textarea with RTL
   - English translation field
   - Grading dropdown (صحيح، حسن، ضعيف، موضوع)
   - Narrator selection
   - Auto-save indicator in Arabic

2. **Create** `src/app/workspace/[slug]/hadith/new/page.tsx`

---

## Using Backend Yjs Infrastructure

The Backend Engineer has provided:

```typescript
// Import providers
import { SupabaseProvider } from '@/lib/yjs/supabase-provider';
import { YjsPersistence } from '@/lib/yjs/persistence';

// Usage in component
const doc = new Y.Doc();
const provider = new SupabaseProvider({ roomId, doc });
const persistence = new YjsPersistence({ documentId, doc });
await persistence.load();
```

---

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Collaborative Editor | `src/components/editor/CollaborativeEditor.tsx` |
| Whiteboard Component | `src/components/whiteboard/CollaborativeWhiteboard.tsx` |
| Hadith Form | `src/components/hadith/HadithForm.tsx` |
| Whiteboard Page | `src/app/workspace/[slug]/whiteboard/[id]/page.tsx` |
| Hadith Page | `src/app/workspace/[slug]/hadith/new/page.tsx` |

---

## Exit Criteria

- [ ] Collaborative editor syncs between 2 users
- [ ] TLDraw whiteboard renders Arabic labels
- [ ] Hadith form saves with Unicode NFC normalization
- [ ] Auto-save indicator shows "تم الحفظ في HH:MM"
- [ ] PNG export includes Arabic text
- [ ] No console errors in browser

---

## Handoff

Upon completion, signal handoff to **QA Engineer** with:
- Routes available for testing
- Known limitations (if any)
- 2-user collaboration test instructions

---

**BEGIN EXECUTION.**
