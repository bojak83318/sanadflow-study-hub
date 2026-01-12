# Phase 2-3: UI Components - Frontend Engineer Stories

> **Agent**: Frontend Engineer  
> **Phase**: 2-3 (Core Features + Real-time Collaboration)  
> **Timeline**: Days 4-5, Week 2 (Jan 16-24, 2026)  
> **Dependencies**: BE-001 (Database ready), INFRA-002 (Vercel deploy)

---

## Story: FE-001 - Next.js Application Scaffold

**As a** Frontend Engineer  
**I want to** set up the Next.js 14 application with RTL support  
**So that** we have a solid foundation for UI development

### Acceptance Criteria

- [ ] Next.js 14 App Router initialized
- [ ] Supabase client configured (browser and server)
- [ ] Tailwind CSS with RTL utilities
- [ ] Arabic font loaded (Amiri or Noto Sans Arabic)
- [ ] Basic layout with RTL toggle

### Technical Details

**Project Initialization**:

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir
```

**Dependencies**:

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @tldraw/tldraw@1.29.2
npm install yjs y-protocols
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-direction
```

**Tailwind RTL Config** (`tailwind.config.ts`):

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Amiri', 'Noto Sans Arabic', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

**Global CSS** (`src/app/globals.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* RTL utilities */
[dir="rtl"] {
  text-align: right;
  direction: rtl;
}

[dir="rtl"] .font-arabic {
  font-family: 'Amiri', 'Noto Sans Arabic', serif;
  line-height: 2;
}

/* Bidirectional text handling */
.bidi-plaintext {
  unicode-bidi: plaintext;
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Next.js config | `next.config.js` |
| Tailwind config | `tailwind.config.ts` |
| Global styles | `src/app/globals.css` |

---

## Story: FE-002 - Supabase Client Configuration

**As a** Frontend Engineer  
**I want to** configure Supabase clients for browser and server  
**So that** authentication and data access work correctly

### Acceptance Criteria

- [ ] Browser client for client components
- [ ] Server client for server components
- [ ] Middleware for session management
- [ ] Auth context provider

### Technical Details

**Browser Client** (`src/lib/supabase/client.ts`):

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server Client** (`src/lib/supabase/server.ts`):

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  );
}
```

**Middleware** (`src/middleware.ts`):

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect workspace routes
  if (request.nextUrl.pathname.startsWith('/workspace') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users away from auth pages
  if (
    (request.nextUrl.pathname.startsWith('/login') ||
     request.nextUrl.pathname.startsWith('/signup')) &&
    user
  ) {
    return NextResponse.redirect(new URL('/workspace', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/workspace/:path*', '/login', '/signup'],
};
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Browser client | `src/lib/supabase/client.ts` |
| Server client | `src/lib/supabase/server.ts` |
| Middleware | `src/middleware.ts` |

---

## Story: FE-003 - Authentication UI

**As a** Frontend Engineer  
**I want to** implement login and signup pages with Supabase Auth  
**So that** users can authenticate securely

### Acceptance Criteria

- [ ] `/login` page with email/password form
- [ ] `/signup` page with full name, email, password
- [ ] Form validation with error messages
- [ ] Redirect to `/workspace` on success
- [ ] RTL support for Arabic labels

### Technical Details

**Login Page** (`src/app/(auth)/login/page.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/workspace');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">
          Sign in to SanadFlow
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Login page | `src/app/(auth)/login/page.tsx` |
| Signup page | `src/app/(auth)/signup/page.tsx` |
| Auth layout | `src/app/(auth)/layout.tsx` |

---

## Story: FE-004 - RTL Arabic Text Editor

**As a** Frontend Engineer  
**I want to** implement a rich text editor with full RTL support  
**So that** users can edit Arabic text without cursor issues

### Acceptance Criteria

- [ ] Tiptap editor integrated
- [ ] Auto-detect RTL when >50% Arabic characters
- [ ] Manual RTL/LTR toggle button
- [ ] Unicode normalization (NFC) on save
- [ ] No cursor jumping on Arabic input

### RTL Requirements (MANDATORY)

Every Arabic text element MUST include:

1. **`dir="rtl"`** - Direction attribute
2. **`lang="ar"`** - Language attribute
3. **`unicode-bidi: plaintext`** - CSS property
4. **`text-align: right`** - Text alignment

### Technical Details

**RTL Editor Component** (`src/components/editor/RichTextEditor.tsx`):

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextDirection from '@tiptap/extension-text-direction';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('rtl');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextDirection.configure({
        types: ['heading', 'paragraph'],
        defaultDirection: direction,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        dir: direction,
        lang: direction === 'rtl' ? 'ar' : 'en',
        class: 'prose max-w-none focus:outline-none min-h-[200px] p-4',
        style: 'unicode-bidi: plaintext; text-align: ' + (direction === 'rtl' ? 'right' : 'left'),
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      // Normalize Unicode to NFC
      const normalized = content.normalize('NFC');
      onChange(normalized);
      
      // Auto-detect direction
      const text = editor.getText();
      const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length || 0;
      const totalChars = text.length;
      
      if (totalChars > 0) {
        const newDirection = arabicChars / totalChars > 0.5 ? 'rtl' : 'ltr';
        if (newDirection !== direction) {
          setDirection(newDirection);
        }
      }
    },
  });

  return (
    <div className="border border-gray-300 rounded-lg">
      <div className="bg-gray-50 p-2 border-b flex gap-2">
        <button
          onClick={() => {
            setDirection('rtl');
            editor?.chain().focus().setTextDirection('rtl').run();
          }}
          className={`px-3 py-1 rounded ${direction === 'rtl' ? 'bg-blue-100' : ''}`}
        >
          RTL (عربي)
        </button>
        <button
          onClick={() => {
            setDirection('ltr');
            editor?.chain().focus().setTextDirection('ltr').run();
          }}
          className={`px-3 py-1 rounded ${direction === 'ltr' ? 'bg-blue-100' : ''}`}
        >
          LTR (English)
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Rich text editor | `src/components/editor/RichTextEditor.tsx` |
| RTL utils | `src/lib/rtl/utils.ts` |

---

## Story: FE-005 - TLDraw Whiteboard Integration

**As a** Frontend Engineer  
**I want to** integrate TLDraw v1.29.2 for I'rab sentence diagrams  
**So that** students can draw Nahw grammar trees

### Acceptance Criteria

- [ ] TLDraw dynamically imported (ssr: false)
- [ ] Custom Arabic text shape registered
- [ ] Canvas state saved to diagrams table
- [ ] PNG export preserves Arabic text
- [ ] Upload to Supabase Storage

### Technical Details

**Whiteboard Component** (`src/components/whiteboard/CollaborativeWhiteboard.tsx`):

```typescript
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// CRITICAL: Must use dynamic import with ssr: false
const TLDraw = dynamic(
  () => import('@tldraw/tldraw').then((mod) => mod.Tldraw),
  { ssr: false, loading: () => <div>Loading whiteboard...</div> }
);

interface WhiteboardProps {
  diagramId: string;
  workspaceId: string;
}

export function CollaborativeWhiteboard({ diagramId, workspaceId }: WhiteboardProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const supabase = createClient();

  const handleChange = useCallback(async (state: any) => {
    // Save to database every 10 seconds
    const { error } = await supabase
      .from('diagrams')
      .upsert({
        id: diagramId,
        workspace_id: workspaceId,
        canvas_state: state.document,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setLastSaved(new Date());
    }
  }, [diagramId, workspaceId, supabase]);

  const handleExportPng = useCallback(async () => {
    // Export canvas to PNG
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      // Upload to Supabase Storage
      const fileName = `${workspaceId}/${diagramId}/${Date.now()}.png`;
      const { error } = await supabase.storage
        .from('diagrams')
        .upload(fileName, blob, {
          contentType: 'image/png',
        });

      if (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [workspaceId, diagramId, supabase]);

  return (
    <div className="h-screen relative">
      <TLDraw
        onChange={handleChange}
        onMount={(app) => {
          // Load existing state
          supabase
            .from('diagrams')
            .select('canvas_state')
            .eq('id', diagramId)
            .single()
            .then(({ data }) => {
              if (data?.canvas_state) {
                app.loadDocument(data.canvas_state);
              }
            });
        }}
      />
      
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={handleExportPng}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export PNG
        </button>
        {lastSaved && (
          <span className="text-sm text-gray-500">
            Saved at {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
```

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Whiteboard component | `src/components/whiteboard/CollaborativeWhiteboard.tsx` |
| Whiteboard page | `src/app/workspace/[slug]/whiteboard/[id]/page.tsx` |

---

## Exit Criteria

Before proceeding to Phase 4:

- [ ] All auth pages functional
- [ ] RTL text editor passes cursor tests
- [ ] TLDraw renders Arabic text correctly
- [ ] Supabase Storage uploads work
- [ ] No console errors in browser

---

## Handoff to QA Engineer

```markdown
## HANDOFF: FRONTEND → QA

**Status**: ✅ UI Components Ready
**Date**: [DATE]

### Available:
- Auth pages: /login, /signup
- Workspace layout
- RTL text editor
- TLDraw whiteboard

### Ready for Testing:
- RTL test suite can now run on deployed app
- All 50 RTL tests should pass
```
