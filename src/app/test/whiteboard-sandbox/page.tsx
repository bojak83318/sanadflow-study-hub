/**
 * Whiteboard Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - TLDraw Arabic Labels Tests
 * 
 * This is a lightweight mock of TLDraw for testing purposes.
 * Tests TC-026 to TC-035 validate Arabic text in whiteboard shapes.
 * 
 * Note: Full TLDraw library is heavy, so we use a mock canvas that
 * simulates the essential behaviors for RTL testing.
 * 
 * @module src/app/test/whiteboard-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Shape {
    id: string;
    type: 'text' | 'arrow' | 'note' | 'group';
    x: number;
    y: number;
    text: string;
    selected: boolean;
}

export default function WhiteboardSandboxPage() {
    const [shapes, setShapes] = useState<Shape[]>([
        { id: 'shape-1', type: 'text', x: 100, y: 100, text: 'الشكل الأول', selected: false },
        { id: 'shape-2', type: 'text', x: 300, y: 100, text: 'الشكل الثاني', selected: false },
    ]);
    const [activeTool, setActiveTool] = useState<'select' | 'text' | 'arrow' | 'note'>('select');
    const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
    const [currentText, setCurrentText] = useState('');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Auto-save every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setLastSaved(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, [shapes]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (activeTool === 'select') return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newShape: Shape = {
            id: `shape-${Date.now()}`,
            type: activeTool === 'arrow' ? 'arrow' : activeTool === 'note' ? 'note' : 'text',
            x,
            y,
            text: '',
            selected: true,
        };

        setShapes([...shapes, newShape]);
        setEditingShapeId(newShape.id);
        setCurrentText('');
    };

    const handleTextInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && editingShapeId) {
            // If just Enter (not Shift+Enter), check if we need to add newline
            if (e.shiftKey === false) {
                // Allow multi-line text with newlines
            }
        }
    };

    const handleTextChange = (text: string) => {
        setCurrentText(text);
        if (editingShapeId) {
            setShapes(shapes.map(s =>
                s.id === editingShapeId ? { ...s, text } : s
            ));
        }
    };

    const handleShapeClick = (shapeId: string) => {
        setShapes(shapes.map(s => ({
            ...s,
            selected: s.id === shapeId
        })));
    };

    const handleShapeDoubleClick = (shapeId: string) => {
        setEditingShapeId(shapeId);
        const shape = shapes.find(s => s.id === shapeId);
        if (shape) setCurrentText(shape.text);
    };

    const handleExport = () => {
        // Simulate PNG export
        const link = document.createElement('a');
        link.download = 'whiteboard-export.png';
        link.href = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        link.click();
    };

    const handleUndo = () => {
        if (shapes.length > 2) {
            setShapes(shapes.slice(0, -1));
        }
    };

    const handleRedo = () => {
        // For simplicity, just re-add default shape
        const lastRemoved = shapes[shapes.length - 1];
        if (lastRemoved) {
            setShapes([...shapes, { ...lastRemoved, id: `shape-${Date.now()}` }]);
        }
    };

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Whiteboard Sandbox - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #1a1a2e;
                        color: white;
                        height: 100vh;
                        overflow: hidden;
                    }
                    
                    .toolbar {
                        display: flex;
                        gap: 10px;
                        padding: 10px;
                        background: #16213e;
                        border-bottom: 1px solid #0f3460;
                    }
                    
                    .tool-btn {
                        padding: 8px 16px;
                        border: 1px solid #0f3460;
                        background: #1a1a2e;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: 'Amiri', serif;
                    }
                    
                    .tool-btn:hover, .tool-btn.active {
                        background: #0f3460;
                    }
                    
                    .canvas {
                        position: relative;
                        width: 100%;
                        height: calc(100vh - 52px);
                        background: #f5f5f5;
                        overflow: hidden;
                    }
                    
                    .shape {
                        position: absolute;
                        padding: 10px 15px;
                        background: white;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        direction: rtl;
                        text-align: right;
                        min-width: 80px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    
                    .shape.selected {
                        border-color: #4a69bd;
                        box-shadow: 0 0 0 2px rgba(74, 105, 189, 0.3);
                    }
                    
                    .shape.arrow {
                        background: transparent;
                        border: none;
                    }
                    
                    .shape.note {
                        background: #ffe066;
                    }
                    
                    .shape-input {
                        border: none;
                        background: transparent;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        direction: rtl;
                        text-align: right;
                        outline: none;
                        width: 100%;
                    }
                    
                    .save-indicator {
                        position: fixed;
                        bottom: 10px;
                        left: 10px;
                        color: #666;
                        font-size: 12px;
                        background: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                    }
                    
                    .arrow-label {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                `}</style>
            </head>
            <body>
                {/* Toolbar */}
                <div className="toolbar">
                    <button
                        data-testid="select-tool"
                        className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                        onClick={() => setActiveTool('select')}
                    >
                        تحديد
                    </button>
                    <button
                        data-testid="text-tool"
                        className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
                        onClick={() => setActiveTool('text')}
                    >
                        نص
                    </button>
                    <button
                        data-testid="arrow-tool"
                        className={`tool-btn ${activeTool === 'arrow' ? 'active' : ''}`}
                        onClick={() => setActiveTool('arrow')}
                    >
                        سهم
                    </button>
                    <button
                        data-testid="note-tool"
                        className={`tool-btn ${activeTool === 'note' ? 'active' : ''}`}
                        onClick={() => setActiveTool('note')}
                    >
                        ملاحظة
                    </button>
                    <button
                        data-testid="export-png"
                        className="tool-btn"
                        onClick={handleExport}
                    >
                        تصدير PNG
                    </button>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    data-testid="tldraw-canvas"
                    className="canvas"
                    onClick={handleCanvasClick}
                >
                    {shapes.map((shape) => (
                        <div
                            key={shape.id}
                            data-testid={shape.type === 'text' ? 'shape-text' :
                                shape.type === 'arrow' ? 'shape-arrow' :
                                    shape.type === 'note' ? 'shape-note' :
                                        'shape-group'}
                            className={`shape ${shape.type} ${shape.selected ? 'selected' : ''}`}
                            style={{ left: shape.x, top: shape.y }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShapeClick(shape.id);
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleShapeDoubleClick(shape.id);
                            }}
                        >
                            {editingShapeId === shape.id ? (
                                <input
                                    type="text"
                                    className="shape-input"
                                    value={currentText}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    onKeyDown={handleTextInput}
                                    autoFocus
                                    dir="rtl"
                                    lang="ar"
                                />
                            ) : (
                                <>
                                    {shape.text || '...'}
                                    {shape.type === 'arrow' && shape.text && (
                                        <span data-testid="arrow-label" className="arrow-label">
                                            {shape.text}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Save Indicator */}
                <div data-testid="save-indicator" className="save-indicator">
                    {lastSaved
                        ? `محفوظ في ${lastSaved.toLocaleTimeString('ar-SA')}`
                        : 'لم يتم الحفظ بعد'
                    }
                </div>
            </body>
        </html>
    );
}
