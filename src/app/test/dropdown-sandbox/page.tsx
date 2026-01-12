/**
 * Dropdown Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Dropdown Menu RTL Tests
 * 
 * Tests RTL positioning of dropdown menus.
 * 
 * @module src/app/test/dropdown-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

export default function DropdownSandboxPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState('');

    const options = [
        { value: 'sahih', label: 'صحيح' },
        { value: 'hasan', label: 'حسن' },
        { value: 'daif', label: 'ضعيف' },
        { value: 'mawdu', label: 'موضوع' },
    ];

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Dropdown Sandbox - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        padding: 20px;
                        min-height: 100vh;
                    }
                    
                    .container {
                        max-width: 400px;
                        margin: 100px auto;
                    }
                    
                    .dropdown {
                        position: relative;
                    }
                    
                    .dropdown-trigger {
                        width: 100%;
                        padding: 15px 20px;
                        background: white;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 16px;
                        direction: rtl;
                        text-align: right;
                        cursor: pointer;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .dropdown-menu {
                        position: absolute;
                        top: 100%;
                        right: 0;
                        width: 100%;
                        background: white;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        margin-top: 4px;
                        z-index: 100;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    
                    .dropdown-item {
                        padding: 12px 20px;
                        cursor: pointer;
                        direction: rtl;
                        text-align: right;
                    }
                    
                    .dropdown-item:hover {
                        background: #f0f0f0;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        القائمة المنسدلة
                    </h1>

                    <div className="dropdown">
                        <button
                            data-testid="dropdown-trigger"
                            className="dropdown-trigger"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            <span>{selected ? options.find(o => o.value === selected)?.label : 'اختر الدرجة'}</span>
                            <span>▼</span>
                        </button>

                        {isOpen && (
                            <div data-testid="dropdown-menu" className="dropdown-menu">
                                {options.map((option) => (
                                    <div
                                        key={option.value}
                                        className="dropdown-item"
                                        onClick={() => {
                                            setSelected(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
