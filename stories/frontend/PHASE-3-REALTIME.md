# Phase 3: Real-time Collaboration - Frontend Engineer Stories

> **Agent**: Frontend Engineer  
> **Phase**: 3 (Real-time Collaboration)  
> **Timeline**: Week 2 (Jan 20-24, 2026)  
> **Dependencies**: BE-009, BE-010 (Yjs infrastructure ready)

---

## Story: FE-005 - Rich Text Editor with Tiptap + Yjs

**As a** Frontend Engineer  
**I want to** integrate Tiptap editor with Yjs for collaborative editing  
**So that** users can edit documents together in real-time

### Acceptance Criteria

- [ ] Tiptap editor with RTL support (`dir="rtl"`, `lang="ar"`)
- [ ] Yjs binding for real-time sync
- [ ] Unicode NFC normalization on all inputs
- [ ] Cursor presence showing other users
- [ ] Auto-save indicator ("Saved at HH:MM")

### ⚠️ MANDATORY RTL Requirements

Every Arabic text element MUST include:
1. `dir="rtl"` - Direction attribute
2. `lang="ar"` - Language attribute
3. `unicode-bidi: plaintext` - CSS property
4. `text-align: right` - Text alignment

### Technical Details

**File**: `src/components/editor/CollaborativeEditor.tsx`

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs/supabase-provider';
import { YjsPersistence } from '@/lib/yjs/persistence';

interface CollaborativeEditorProps {
  documentId: string;
  roomId: string;
  userName: string;
  userColor: string;
}

export function CollaborativeEditor({
  documentId,
  roomId,
  userName,
  userColor,
}: CollaborativeEditorProps) {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<SupabaseProvider | null>(null);
  const [persistence, setPersistence] = useState<YjsPersistence | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Yjs provider and persistence
  useEffect(() => {
    const initYjs = async () => {
      const newPersistence = new YjsPersistence({ documentId, doc });
      await newPersistence.load();
      setPersistence(newPersistence);

      const newProvider = new SupabaseProvider({
        roomId,
        doc,
        awareness: undefined, // Will use default
      });
      setProvider(newProvider);
      setIsLoading(false);
    };

    initYjs();

    return () => {
      provider?.destroy();
      persistence?.destroy();
    };
  }, [documentId, roomId]);

  // Track saves
  useEffect(() => {
    if (!persistence) return;

    const onUpdate = () => {
      // Update save indicator after debounced save
      setTimeout(() => setLastSaved(new Date()), 10100);
    };

    doc.on('update', onUpdate);
    return () => doc.off('update', onUpdate);
  }, [persistence, doc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs handles history
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        provider: provider as any,
        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],
    editorProps: {
      attributes: {
        dir: 'rtl',
        lang: 'ar',
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
        style: 'unicode-bidi: plaintext; text-align: right; font-family: Amiri, serif;',
      },
    },
    onUpdate: ({ editor }) => {
      // Normalize Unicode to NFC
      const html = editor.getHTML();
      const normalized = html.normalize('NFC');
      if (html !== normalized) {
        editor.commands.setContent(normalized, false);
      }
    },
  }, [provider]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading document...</span>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg" dir="rtl">
      {/* Toolbar */}
      <div className="bg-gray-50 p-2 border-b flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${editor?.isActive('bold') ? 'bg-blue-100' : ''}`}
          >
            <strong>غامق</strong>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${editor?.isActive('italic') ? 'bg-blue-100' : ''}`}
          >
            <em>مائل</em>
          </button>
        </div>
        
        {/* Save indicator */}
        <div className="text-sm text-gray-500">
          {lastSaved ? (
            <span>تم الحفظ في {lastSaved.toLocaleTimeString('ar-SA')}</span>
          ) : (
            <span>جاري الحفظ...</span>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Dependencies

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Collaborative Editor | `src/components/editor/CollaborativeEditor.tsx` |
| Editor styles | `src/components/editor/editor.css` |

---

## Story: FE-006 - TLDraw Whiteboard Integration

**As a** Frontend Engineer  
**I want to** integrate TLDraw v1.29.2 for I'rab sentence diagrams  
**So that** students can draw Nahw grammar trees collaboratively

### Acceptance Criteria

- [ ] TLDraw dynamically imported (`ssr: false`)
- [ ] Custom Arabic text shape for grammar labels
- [ ] Canvas state synced via Yjs
- [ ] PNG export preserves Arabic text
- [ ] Auto-save to diagrams table

### Technical Details

**File**: `src/components/whiteboard/CollaborativeWhiteboard.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs/supabase-provider';
import { createClient } from '@/lib/supabase/client';

// CRITICAL: Dynamic import with ssr: false
const Tldraw = dynamic(
  () => import('@tldraw/tldraw').then((mod) => mod.Tldraw),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <span className="text-gray-500">جاري تحميل السبورة...</span>
      </div>
    ),
  }
);

interface CollaborativeWhiteboardProps {
  diagramId: string;
  workspaceId: string;
  roomId: string;
}

export function CollaborativeWhiteboard({
  diagramId,
  workspaceId,
  roomId,
}: CollaborativeWhiteboardProps) {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<SupabaseProvider | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const newProvider = new SupabaseProvider({ roomId, doc });
    setProvider(newProvider);

    // Load existing diagram state
    loadDiagram();

    return () => {
      newProvider.destroy();
    };
  }, [roomId]);

  const loadDiagram = async () => {
    const { data } = await supabase
      .from('diagrams')
      .select('canvas_state')
      .eq('id', diagramId)
      .single();

    if (data?.canvas_state) {
      // Apply loaded state to Yjs doc
      const yCanvas = doc.getMap('canvas');
      yCanvas.set('state', data.canvas_state);
    }
  };

  const handleChange = useCallback(async (editor: any) => {
    // Debounced auto-save every 10 seconds
    const state = editor.store.getSnapshot();
    
    const { error } = await supabase
      .from('diagrams')
      .upsert({
        id: diagramId,
        workspace_id: workspaceId,
        canvas_state: state,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setLastSaved(new Date());
    }
  }, [diagramId, workspaceId, supabase]);

  const handleExportPng = useCallback(async (editor: any) => {
    const blob = await editor.exportImage('png');
    
    // Upload to Supabase Storage
    const fileName = `${workspaceId}/${diagramId}/${Date.now()}.png`;
    const { error } = await supabase.storage
      .from('diagrams')
      .upload(fileName, blob, { contentType: 'image/png' });

    if (error) {
      console.error('Export failed:', error);
      return;
    }

    // Download for user
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${diagramId}.png`;
    a.click();
  }, [workspaceId, diagramId, supabase]);

  return (
    <div className="h-screen relative" dir="ltr">
      <Tldraw
        onMount={(editor) => {
          // Set up auto-save
          editor.store.listen(() => handleChange(editor), { 
            scope: 'document',
          });
        }}
      />
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-50">
        <button
          onClick={() => {/* Get editor reference and export */}}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          تصدير PNG
        </button>
        {lastSaved && (
          <span className="px-4 py-2 bg-white rounded shadow text-sm text-gray-600">
            تم الحفظ في {lastSaved.toLocaleTimeString('ar-SA')}
          </span>
        )}
      </div>
    </div>
  );
}
```

### Dependencies

```bash
npm install @tldraw/tldraw@1.29.2
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Whiteboard Component | `src/components/whiteboard/CollaborativeWhiteboard.tsx` |
| Whiteboard Page | `src/app/workspace/[slug]/whiteboard/[id]/page.tsx` |

---

## Story: FE-007 - Hadith Entry Form

**As a** Frontend Engineer  
**I want to** create a hadith entry form with RTL Arabic input  
**So that** users can catalog hadiths with proper metadata

### Acceptance Criteria

- [ ] Arabic text input with RTL direction
- [ ] Narrator selection dropdown
- [ ] Grading dropdown (Sahih, Hasan, Daif, Mawdu)
- [ ] Auto-save indicator
- [ ] Form validation with Arabic error messages

### Technical Details

**File**: `src/components/hadith/HadithForm.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface HadithFormProps {
  workspaceId: string;
  onSave?: (hadith: any) => void;
}

const GRADINGS = [
  { value: 'sahih', label: 'صحيح', labelEn: 'Sahih' },
  { value: 'hasan', label: 'حسن', labelEn: 'Hasan' },
  { value: 'daif', label: 'ضعيف', labelEn: 'Daif' },
  { value: 'mawdu', label: 'موضوع', labelEn: 'Mawdu' },
];

export function HadithForm({ workspaceId, onSave }: HadithFormProps) {
  const [arabicText, setArabicText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [grading, setGrading] = useState('');
  const [narratorId, setNarratorId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  
  const supabase = createClient();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // Normalize Arabic text to NFC
      const normalizedArabic = arabicText.normalize('NFC');

      const { data, error: saveError } = await supabase
        .from('hadiths')
        .insert({
          workspace_id: workspaceId,
          arabic_text: normalizedArabic,
          english_translation: englishText || null,
          grading: grading || null,
          narrator_ids: narratorId ? [narratorId] : [],
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setLastSaved(new Date());
      onSave?.(data);
      
      // Reset form
      setArabicText('');
      setEnglishText('');
      setGrading('');
      setNarratorId('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  }, [arabicText, englishText, grading, narratorId, workspaceId, supabase, onSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Arabic Text */}
      <div>
        <label htmlFor="arabicText" className="block text-sm font-medium mb-2">
          نص الحديث (عربي) *
        </label>
        <textarea
          id="arabicText"
          required
          dir="rtl"
          lang="ar"
          value={arabicText}
          onChange={(e) => setArabicText(e.target.value.normalize('NFC'))}
          className="w-full h-40 p-4 border rounded-lg font-arabic text-lg"
          style={{ unicodeBidi: 'plaintext', textAlign: 'right' }}
          placeholder="أدخل نص الحديث هنا..."
        />
      </div>

      {/* English Translation */}
      <div>
        <label htmlFor="englishText" className="block text-sm font-medium mb-2">
          الترجمة الإنجليزية (اختياري)
        </label>
        <textarea
          id="englishText"
          dir="ltr"
          lang="en"
          value={englishText}
          onChange={(e) => setEnglishText(e.target.value)}
          className="w-full h-24 p-4 border rounded-lg"
          placeholder="Enter English translation..."
        />
      </div>

      {/* Grading */}
      <div>
        <label htmlFor="grading" className="block text-sm font-medium mb-2">
          درجة الحديث
        </label>
        <select
          id="grading"
          value={grading}
          onChange={(e) => setGrading(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          <option value="">اختر الدرجة...</option>
          {GRADINGS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label} ({g.labelEn})
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isSaving || !arabicText}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ الحديث'}
        </button>

        {lastSaved && (
          <span className="text-sm text-gray-500">
            تم الحفظ في {lastSaved.toLocaleTimeString('ar-SA')}
          </span>
        )}
      </div>
    </form>
  );
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Hadith Form | `src/components/hadith/HadithForm.tsx` |
| Hadith Page | `src/app/workspace/[slug]/hadith/new/page.tsx` |

---

## Exit Criteria

Before proceeding to Phase 4:

- [ ] Collaborative editor syncs between 2 users
- [ ] TLDraw whiteboard renders Arabic labels
- [ ] Hadith form saves with Unicode NFC normalization
- [ ] Auto-save indicator shows "تم الحفظ في"
- [ ] No console errors in browser

---

## Handoff to QA Engineer

```markdown
## HANDOFF: FRONTEND → QA

**Status**: ✅ Phase 3 UI Components Ready
**Date**: [DATE]

### Available:
- Collaborative rich text editor
- TLDraw whiteboard with export
- Hadith entry form

### Ready for Testing:
- Real-time collaboration (2-user test)
- RTL text rendering
- Auto-save functionality
- Export PNG feature
```
