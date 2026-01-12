/**
 * Breadcrumb Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Breadcrumb RTL Tests
 * 
 * @module src/app/test/breadcrumb-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React from 'react';

export default function BreadcrumbSandboxPage() {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Breadcrumb Sandbox - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        padding: 20px;
                    }
                    
                    .breadcrumb {
                        display: flex;
                        gap: 10px;
                        padding: 15px;
                        background: white;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        direction: rtl;
                    }
                    
                    .breadcrumb-item {
                        color: #4a69bd;
                    }
                    
                    .breadcrumb-separator {
                        color: #999;
                    }
                    
                    .content {
                        background: white;
                        border-radius: 12px;
                        padding: 30px;
                    }
                `}</style>
            </head>
            <body>
                <nav data-testid="breadcrumb" className="breadcrumb" dir="rtl">
                    <span className="breadcrumb-item">الرئيسية</span>
                    <span className="breadcrumb-separator">←</span>
                    <span className="breadcrumb-item">مساحة العمل</span>
                    <span className="breadcrumb-separator">←</span>
                    <span className="breadcrumb-item">المستندات</span>
                </nav>

                <div className="content">
                    <h1>صفحة اختبار التنقل</h1>
                    <p>هذه صفحة لاختبار عناصر التنقل بالنسبة للاتجاه RTL.</p>
                </div>
            </body>
        </html>
    );
}
