---
id: "20260111_irab_whiteboard"
difficulty: "hard"
tags: ["frontend", "tldraw", "arabic", "rtl", "whiteboard"]
tech_stack: "TLDraw 1.29.2, React 18, Next.js 14"
---

# User Story: I'rab Sentence Diagram Whiteboard

## As a
Nahw Student (Frontend Engineer implementing)

## I want to
Draw I'rab sentence trees with arrows connecting words

## So that
I can visualize grammatical relationships for 50+ practice sentences

## Context & Constraints
**TLDraw Version**: 1.29.2 (stable, NOT beta)
**Canvas Requirements:**
- Text boxes with Arabic labels
- Arrows with customizable colors
- Auto-save every 10 seconds
- Real-time sync for 3 concurrent editors

**Example I'rab Diagram:**
```
     ضَرَبَ
       │
    ┌──┴──┐
    │     │
  زَيْدٌ   عَمْرًا
  (فاعل)  (مفعول به)
```

## Acceptance Criteria
- [ ] Add text boxes with Arabic labels (RTL aligned)
- [ ] Draw arrows between text boxes
- [ ] Export diagram as PNG (300 DPI, RTL preserved)
- [ ] Real-time cursor sync with other editors (< 1s latency)
- [ ] Undo/redo works for 20 steps
- [ ] Canvas loads in < 1 second (50 objects)
- [ ] Mobile touch gestures work (iPad Pro)

## Technical Notes
```tsx
import { TLDraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/dist/main.css';

const IrabDiagram: React.FC<{ diagramId: string }> = ({ diagramId }) => {
  const { doc, awareness } = useYjsProvider(diagramId);
  
  const handleChange = useCallback((state) => {
    // Sync to Yjs
    doc.transact(() => {
      doc.getMap('state').set('document', state.document);
    });
  }, [doc]);

  return (
    <div className="w-full h-[600px]">
      <TLDraw
        showUI
        showMenu
        showPages={false}
        onChange={handleChange}
      />
    </div>
  );
};
```

## RTL Text Box Requirements
```typescript
// When creating Arabic text box
const createArabicTextBox = (text: string) => ({
  type: 'text',
  text,
  style: {
    textAlign: 'right',
    font: 'arabic',
  },
  props: {
    dir: 'rtl',
    lang: 'ar',
  },
});
```

## Dependencies
- TLDraw 1.29.2 installed
- Yjs provider for real-time sync
- Cloudflare R2 for PNG storage (if > 1MB)
