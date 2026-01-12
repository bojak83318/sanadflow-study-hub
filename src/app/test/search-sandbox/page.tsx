/**
 * Search Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Search Results RTL Tests
 * 
 * Tests RTL layout of search results.
 * 
 * @module src/app/test/search-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

const SAMPLE_HADITHS = [
    { id: 1, text: 'إنما الأعمال بالنيات', narrator: 'عمر بن الخطاب', book: 'صحيح البخاري' },
    { id: 2, text: 'الدين النصيحة', narrator: 'تميم الداري', book: 'صحيح مسلم' },
    { id: 3, text: 'المسلم من سلم المسلمون', narrator: 'عبدالله بن عمرو', book: 'صحيح البخاري' },
    { id: 4, text: 'حديث جبريل عن الإيمان', narrator: 'عمر بن الخطاب', book: 'صحيح مسلم' },
    { id: 5, text: 'لا يؤمن أحدكم حتى يحب لأخيه', narrator: 'أنس بن مالك', book: 'صحيح البخاري' },
];

export default function SearchSandboxPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<typeof SAMPLE_HADITHS>([]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            const filtered = SAMPLE_HADITHS.filter(h =>
                h.text.includes(query) ||
                h.narrator.includes(query) ||
                h.book.includes(query)
            );
            setResults(filtered.length > 0 ? filtered : SAMPLE_HADITHS);
        }
    };

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Search Sandbox - SanadFlow</title>
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
                        max-width: 700px;
                        margin: 0 auto;
                    }
                    
                    .search-form {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .search-input {
                        flex: 1;
                        padding: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 16px;
                        direction: rtl;
                        text-align: right;
                    }
                    
                    .search-btn {
                        padding: 15px 30px;
                        background: #4a69bd;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 16px;
                        cursor: pointer;
                    }
                    
                    .search-results {
                        background: white;
                        border-radius: 12px;
                        padding: 15px;
                        direction: rtl;
                    }
                    
                    .result-item {
                        padding: 15px;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .result-item:last-child {
                        border-bottom: none;
                    }
                    
                    .result-text {
                        font-size: 18px;
                        margin-bottom: 8px;
                    }
                    
                    .result-meta {
                        color: #666;
                        font-size: 14px;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        البحث في الأحاديث
                    </h1>

                    <form className="search-form" onSubmit={handleSearch}>
                        <input
                            data-testid="search-input"
                            className="search-input"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ابحث عن حديث..."
                            dir="rtl"
                        />
                        <button type="submit" className="search-btn">
                            بحث
                        </button>
                    </form>

                    {results.length > 0 && (
                        <div data-testid="search-results" className="search-results" dir="rtl">
                            {results.map((result) => (
                                <div key={result.id} className="result-item">
                                    <div className="result-text">{result.text}</div>
                                    <div className="result-meta">
                                        {result.narrator} - {result.book}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
