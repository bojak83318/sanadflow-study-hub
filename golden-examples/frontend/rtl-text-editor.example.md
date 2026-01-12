---
id: "frontend_001_rtl_editor"
difficulty: "medium"
tags: ["react", "rtl", "tiptap", "arabic"]
source_url: "https://leancode.co/blog/right-to-left-in-react"
---

# Arabic RTL Text Handling with Cursor Position Preservation

## Problem
Handling bidirectional text (Arabic/English) in web editors often leads to cursor jumping, incorrect directionality, and encoding issues, especially when mixing languages.

## Solution

```typescript
// components/ArabicTextEditor.tsx
import React, { useRef, useEffect, useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextDirection from '@tiptap/extension-text-direction'

interface ArabicTextEditorProps {
  initialContent: string
  onChange: (content: string) => void
  language: 'ar' | 'en' | 'mixed'
}

export const ArabicTextEditor: React.FC<ArabicTextEditorProps> = ({
  initialContent,
  onChange,
  language
}) => {
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl' | 'auto'>(
    language === 'ar' ? 'rtl' : language === 'en' ? 'ltr' : 'auto'
  )
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextDirection.configure({
        types: ['heading', 'paragraph'],
        defaultDirection: textDirection
      })
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        dir: textDirection,
        lang: language === 'ar' ? 'ar' : 'en',
        class: 'prose prose-lg focus:outline-none min-h-[200px] p-4'
      }
    },
    onUpdate: ({ editor }) => {
      // Normalize Arabic text to prevent encoding issues
      const content = editor.getHTML()
      const normalized = content.normalize('NFC')
      onChange(normalized)
    }
  })
  
  // Auto-detect text direction from content
  useEffect(() => {
    if (!editor || language !== 'mixed') return
    
    const detectDirection = () => {
      const text = editor.getText()
      const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length || 0
      const totalChars = text.length
      
      if (arabicChars / totalChars > 0.5) {
        setTextDirection('rtl')
      } else {
        setTextDirection('ltr')
      }
    }
    
    editor.on('update', detectDirection)
    return () => {
      editor.off('update', detectDirection)
    }
  }, [editor, language])
  
  return (
    <div className="border border-gray-300 rounded-lg">
      <div className="bg-gray-50 p-2 border-b flex gap-2">
        <button
          onClick={() => editor?.chain().focus().setTextDirection('rtl').run()}
          className="px-3 py-1 rounded hover:bg-gray-200"
        >
          RTL (Arabic)
        </button>
        <button
          onClick={() => editor?.chain().focus().setTextDirection('ltr').run()}
          className="px-3 py-1 rounded hover:bg-gray-200"
        >
          LTR (English)
        </button>
      </div>
      <div className="editor-content" />
    </div>
  )
}

// Alternative: Simple contentEditable with cursor preservation
export const SimpleArabicInput: React.FC<{
  value: string
  onChange: (value: string) => void
  dir?: 'rtl' | 'ltr' | 'auto'
}> = ({ value, onChange, dir = 'auto' }) => {
  const textareaRef = useRef<HTMLDivElement>(null)
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  
  // Save cursor position before update
  const saveCursorPosition = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      setCursorPosition(range.startOffset)
    }
  }
  
  // Restore cursor position after update
  useEffect(() => {
    if (!textareaRef.current) return
    
    const selection = window.getSelection()
    const range = document.createRange()
    
    try {
      const textNode = textareaRef.current.firstChild
      if (textNode) {
        range.setStart(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    } catch (error) {
      console.warn('Failed to restore cursor position:', error)
    }
  }, [value, cursorPosition])
  
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    saveCursorPosition()
    const text = e.currentTarget.textContent || ''
    onChange(text.normalize('NFC')) // Normalize Arabic
  }
  
  return (
    <div
      ref={textareaRef}
      contentEditable
      dir={dir}
      lang={dir === 'rtl' ? 'ar' : 'en'}
      onInput={handleInput}
      onBlur={saveCursorPosition}
      suppressContentEditableWarning
      className="border p-3 rounded-lg min-h-[100px] focus:outline-blue-500"
      style={{
        unicodeBidi: 'plaintext', // Proper bidirectional text handling
        textAlign: dir === 'rtl' ? 'right' : 'left'
      }}
    >
      {value}
    </div>
  )
}
```

## Key Learnings
- **Tool Selection**: TipTap's `TextDirection` extension provides robust browser-native RTL support.
- **CSS Properties**: `unicodeBidi: 'plaintext'` is essential for preventing cursor jumping in mixed Arabic-English text contexts.
- **Data Integrity**: Unicode NFC normalization ensures consistent storage and retrieval of Arabic diacritics, preventing database encoding errors.
