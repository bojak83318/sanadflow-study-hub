/**
 * Long Document Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Scrolling RTL Tests
 * 
 * Tests scrolling behavior in RTL documents.
 * 
 * @module src/app/test/long-document/page
 * @agent qa-engineer
 */

'use client';

import React from 'react';

// Generate sample long Arabic text
const PARAGRAPH = 'بسم الله الرحمن الرحيم. الحمد لله رب العالمين. الرحمن الرحيم. مالك يوم الدين. إياك نعبد وإياك نستعين. اهدنا الصراط المستقيم. صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين. ';

export default function LongDocumentPage() {
    const paragraphs = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        text: PARAGRAPH.repeat(3)
    }));

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Long Document - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .document-content {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background: white;
                        min-height: 100vh;
                        overflow-y: auto;
                        direction: rtl;
                    }
                    
                    .paragraph {
                        font-size: 18px;
                        line-height: 2;
                        margin-bottom: 20px;
                        text-align: right;
                    }
                    
                    .paragraph-number {
                        color: #666;
                        margin-left: 10px;
                    }
                `}</style>
            </head>
            <body>
                <div
                    data-testid="document-content"
                    className="document-content"
                    dir="rtl"
                >
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        مستند طويل للاختبار
                    </h1>

                    {paragraphs.map((p) => (
                        <p key={p.id} className="paragraph">
                            <span className="paragraph-number">[{p.id}]</span>
                            {p.text}
                        </p>
                    ))}
                </div>
            </body>
        </html>
    );
}
