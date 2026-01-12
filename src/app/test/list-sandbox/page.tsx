/**
 * List Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Bilingual Lists RTL Tests
 * 
 * Tests Arabic-English bullet points and list rendering.
 * 
 * @module src/app/test/list-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React from 'react';

export default function ListSandboxPage() {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>List Sandbox - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        padding: 20px;
                    }
                    
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                    }
                    
                    ul {
                        direction: rtl;
                        text-align: right;
                        padding-right: 20px;
                        padding-left: 0;
                    }
                    
                    li {
                        margin-bottom: 10px;
                        font-size: 18px;
                    }
                    
                    .nested-list {
                        margin-top: 10px;
                        padding-right: 20px;
                    }
                    
                    .nested-list li {
                        font-size: 16px;
                        color: #666;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        قائمة مختلطة
                    </h1>

                    <ul data-testid="mixed-list" dir="rtl">
                        <li>
                            أصول الفقه - Usul al-Fiqh
                            <ul className="nested-list" dir="ltr">
                                <li>Qiyas (Analogy)</li>
                                <li>Ijma (Consensus)</li>
                            </ul>
                        </li>
                        <li>
                            علم الحديث - Hadith Sciences
                            <ul className="nested-list" dir="ltr">
                                <li>Isnad Analysis</li>
                                <li>Matn Criticism</li>
                            </ul>
                        </li>
                        <li>
                            النحو العربي - Arabic Grammar
                            <ul className="nested-list" dir="rtl">
                                <li>الإعراب - I&apos;rab</li>
                                <li>البناء - Bina</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </body>
        </html>
    );
}
