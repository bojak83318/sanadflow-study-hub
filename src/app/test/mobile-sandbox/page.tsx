/**
 * Mobile Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Mobile Arabic Keyboard Tests
 * 
 * This page simulates mobile viewport testing for Arabic input.
 * Tests TC-036 to TC-050 validate touch input and mobile RTL layouts.
 * 
 * @module src/app/test/mobile-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

export default function MobileSandboxPage() {
    const [mobileValue, setMobileValue] = useState('');

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Mobile Sandbox - SanadFlow</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        padding: 16px;
                    }
                    
                    .mobile-container {
                        max-width: 100%;
                        direction: rtl;
                    }
                    
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        font-size: 1.5rem;
                        color: #1a1a2e;
                    }
                    
                    .mobile-editor {
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 12px;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        line-height: 1.8;
                        direction: rtl;
                        text-align: right;
                        unicode-bidi: plaintext;
                        min-height: 150px;
                        resize: none;
                        -webkit-appearance: none;
                        background: white;
                    }
                    
                    .mobile-editor:focus {
                        outline: none;
                        border-color: #4a69bd;
                    }
                `}</style>
            </head>
            <body>
                <div
                    data-testid="mobile-container"
                    className="mobile-container"
                    dir="rtl"
                >
                    <h1 className="header">اختبار الجوال</h1>

                    <textarea
                        data-testid="mobile-editor"
                        dir="rtl"
                        lang="ar"
                        value={mobileValue}
                        onChange={(e) => setMobileValue(e.target.value.normalize('NFC'))}
                        placeholder="اكتب هنا..."
                        className="mobile-editor"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                </div>
            </body>
        </html>
    );
}
