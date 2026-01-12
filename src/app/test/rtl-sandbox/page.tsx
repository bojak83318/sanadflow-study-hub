/**
 * RTL Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Test Target Page
 * 
 * This page provides all necessary UI elements for the RTL test suite.
 * Categories covered:
 * - Pure Arabic text input (TC-001 to TC-010)
 * - Mixed Arabic-English text (TC-011 to TC-025)
 * - Edge cases and Unicode handling (TC-046 to TC-050)
 * 
 * @module src/app/test/rtl-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

// Sample pre-populated content for search
const SAMPLE_HADITHS = [
    { id: 1, text: 'إنما الأعمال بالنيات' },
    { id: 2, text: 'الحديث عن الإيمان' },
    { id: 3, text: 'من حسن إسلام المرء تركه ما لا يعنيه' },
];

export default function RTLSandboxPage() {
    // State for Pure Arabic editor
    const [arabicValue, setArabicValue] = useState('');

    // State for Mixed editor
    const [mixedValue, setMixedValue] = useState('');

    // State for search
    const [searchQuery, setSearchQuery] = useState('');

    // Filter search results
    const searchResults = searchQuery
        ? SAMPLE_HADITHS.filter(h => h.text.includes(searchQuery))
        : [];

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>RTL Sandbox - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * {
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Amiri', 'Noto Naskh Arabic', serif;
                        margin: 0;
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .section {
                        background: white;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .section-title {
                        font-size: 1.5rem;
                        margin-bottom: 15px;
                        color: #1a1a2e;
                    }
                    
                    .editor-input {
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        line-height: 1.8;
                        direction: rtl;
                        text-align: right;
                        unicode-bidi: plaintext;
                        min-height: 100px;
                        resize: vertical;
                    }
                    
                    .editor-input:focus {
                        outline: none;
                        border-color: #4a69bd;
                    }
                    
                    .search-input {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 16px;
                        direction: rtl;
                        text-align: right;
                    }
                    
                    .search-results {
                        margin-top: 10px;
                        padding: 10px;
                        background: #f8f8f8;
                        border-radius: 4px;
                    }
                    
                    .search-result-item {
                        padding: 8px;
                        border-bottom: 1px solid #eee;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        صفحة اختبار النص العربي
                    </h1>

                    {/* Pure Arabic Editor Section */}
                    <div className="section">
                        <h2 className="section-title">محرر النص العربي</h2>
                        <textarea
                            data-testid="arabic-editor"
                            dir="rtl"
                            lang="ar"
                            value={arabicValue}
                            onChange={(e) => setArabicValue(e.target.value.normalize('NFC'))}
                            placeholder="أدخل نص الحديث هنا..."
                            className="editor-input"
                            style={{
                                direction: 'rtl',
                                textAlign: 'right',
                                unicodeBidi: 'plaintext',
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                    </div>

                    {/* Mixed Arabic-English Editor Section */}
                    <div className="section">
                        <h2 className="section-title">محرر النص المختلط</h2>
                        <textarea
                            data-testid="mixed-editor"
                            dir="rtl"
                            lang="ar"
                            value={mixedValue}
                            onChange={(e) => setMixedValue(e.target.value.normalize('NFC'))}
                            placeholder="أدخل نص مختلط عربي/إنجليزي - Enter mixed Arabic/English text"
                            className="editor-input"
                            style={{
                                direction: 'rtl',
                                textAlign: 'right',
                                unicodeBidi: 'plaintext',
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                    </div>

                    {/* Search Section */}
                    <div className="section">
                        <h2 className="section-title">البحث</h2>
                        <input
                            data-testid="search-input"
                            type="text"
                            dir="rtl"
                            lang="ar"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن حديث..."
                            className="search-input"
                        />
                        {searchQuery && (
                            <div
                                data-testid="search-results"
                                className="search-results"
                                dir="rtl"
                            >
                                {searchResults.length > 0 ? (
                                    searchResults.map((result) => (
                                        <div key={result.id} className="search-result-item">
                                            {result.text}
                                        </div>
                                    ))
                                ) : (
                                    <div>لا توجد نتائج</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
