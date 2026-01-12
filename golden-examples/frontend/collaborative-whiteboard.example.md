---
id: "frontend_002_tldraw_collab"
difficulty: "hard"
tags: ["tldraw", "react", "yjs", "nextjs", "whiteboard"]
source_url: "https://getstream.io/blog/collaborative-nextjs-whiteboard/"
---

# TLDraw Whiteboard with Yjs Real-time Sync

## Problem
Integrating a graphical whiteboard (TLDraw) into a Next.js application with real-time multi-user collaboration, custom shapes for Arabic text, and efficient conflict resolution.

## Solution

```typescript
// components/CollaborativeWhiteboard.tsx
'use client'

import { Tldraw, useEditor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useYjsStore } from './useYjsStore'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'

interface CollaborativeWhiteboardProps {
  roomId: string
  userId: string
  userName: string
  userColor: string
}

// Must use dynamic import with ssr: false for TLDraw
const CollaborativeWhiteboardInner = ({
  roomId,
  userId,
  userName,
  userColor
}: CollaborativeWhiteboardProps) => {
  const store = useYjsStore({
    roomId,
    hostUrl: process.env.NEXT_PUBLIC_YJS_WS_URL || 'ws://localhost:1234'
  })
  
  return (
    <div className="fixed inset-0" style={{ height: '100vh' }}>
      <Tldraw
        store={store}
        onMount={(editor) => {
          // Set user info for multiplayer cursors
          editor.user.updateUserPreferences({
            id: userId,
            name: userName,
            color: userColor
          })
          
          // Custom Arabic text shape
          editor.registerShape({
            type: 'arabic-text',
            props: {
              text: '',
              direction: 'rtl'
            },
            render: ({ text, direction }) => (
              <div
                dir={direction}
                lang="ar"
                style={{
                  fontFamily: 'Amiri, serif',
                  fontSize: '18px',
                  unicodeBidi: 'plaintext'
                }}
              >
                {text}
              </div>
            )
          })
        }}
      />
    </div>
  )
}

export const CollaborativeWhiteboard = dynamic(
  () => Promise.resolve(CollaborativeWhiteboardInner),
  { ssr: false, loading: () => <div>Loading whiteboard...</div> }
)

// hooks/useYjsStore.ts
import { useSync } from '@tldraw/sync'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useEffect, useState } from 'react'
import { TLStoreWithStatus } from '@tldraw/tldraw'

export function useYjsStore({ roomId, hostUrl }: { roomId: string; hostUrl: string }) {
  const [store, setStore] = useState<TLStoreWithStatus>()
  
  useEffect(() => {
    const yDoc = new Y.Doc({ guid: roomId })
    const yStore = yDoc.getMap('tldraw')
    
    const provider = new WebsocketProvider(hostUrl, roomId, yDoc, {
      connect: true
    })
    
    provider.on('status', ({ status }: { status: string }) => {
      console.log(`Yjs connection status: ${status}`)
    })
    
    // Sync TLDraw store with Yjs
    const storeWithSync = useSync({
      uri: `${hostUrl}/${roomId}`,
      roomId
    })
    
    setStore(storeWithSync)
    
    return () => {
      provider.disconnect()
      yDoc.destroy()
    }
  }, [roomId, hostUrl])
  
  return store
}

// app/room/[roomId]/page.tsx
import { CollaborativeWhiteboard } from '@/components/CollaborativeWhiteboard'

export default function RoomPage({ params }: { params: { roomId: string } }) {
  // Fetch user session (implementation from earlier)
  const session = await getUserSession()
  
  return (
    <main>
      <CollaborativeWhiteboard
        roomId={params.roomId}
        userId={session.user.id}
        userName={session.user.user_metadata.userName}
        userColor={session.user.user_metadata.userColor}
      />
    </main>
  )
}
```

## Key Learnings
- **SSR Handling**: TLDraw requires `window` access, so dynamic imports with `ssr: false` are mandatory in Next.js.
- **State Synoc**: The `useSync` hook simplifies connecting TLDraw's internal state store with the Yjs document.
- **Custom Shapes**: Extending TLDraw with custom shapes allows for specific requirements like RTL text support for Arabic.
- **Performance**: Yjs WebSocket providers can scalable handle 50+ concurrent users with low latency (<100ms).
