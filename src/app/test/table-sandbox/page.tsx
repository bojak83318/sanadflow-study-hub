/**
 * Table Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Bilingual Table RTL Tests
 * 
 * Tests tables with bilingual headers and RTL data.
 * 
 * @module src/app/test/table-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React from 'react';

export default function TableSandboxPage() {
    const hadiths = [
        { id: 1, arabic: 'إنما الأعمال بالنيات', narrator: 'عمر بن الخطاب', grading: 'صحيح' },
        { id: 2, arabic: 'الدين النصيحة', narrator: 'تميم الداري', grading: 'صحيح' },
        { id: 3, arabic: 'المسلم من سلم المسلمون', narrator: 'عبدالله بن عمرو', grading: 'صحيح' },
    ];

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Table Sandbox - SanadFlow</title>
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
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        direction: rtl;
                    }
                    
                    th, td {
                        padding: 12px 15px;
                        text-align: right;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    th {
                        background: #4a69bd;
                        color: white;
                        font-weight: bold;
                    }
                    
                    tr:hover {
                        background: #f8f8f8;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        جدول الأحاديث
                    </h1>

                    <table data-testid="bilingual-table">
                        <thead>
                            <tr>
                                <th dir="rtl">نص الحديث (Hadith Text)</th>
                                <th dir="rtl">الراوي (Narrator)</th>
                                <th dir="rtl">الدرجة (Grading)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hadiths.map((hadith) => (
                                <tr key={hadith.id}>
                                    <td dir="rtl">{hadith.arabic}</td>
                                    <td dir="rtl">{hadith.narrator}</td>
                                    <td dir="rtl">{hadith.grading}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
    );
}
