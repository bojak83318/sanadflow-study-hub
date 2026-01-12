/**
 * Workspace Documents Page (with Breadcrumb) for Playwright Testing
 * Phase 0: RTL Validation - Breadcrumb RTL Tests
 * 
 * @module src/app/workspace/[workspaceId]/documents/page
 * @agent qa-engineer
 */

'use client';

import React from 'react';

export default function WorkspaceDocumentsPage() {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Documents - SanadFlow</title>
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
                    
                    .documents-list {
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    
                    .document-item {
                        padding: 15px;
                        border-bottom: 1px solid #e0e0e0;
                        display: flex;
                        justify-content: space-between;
                        cursor: pointer;
                    }
                    
                    .document-item:hover {
                        background: #f8f8f8;
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

                <div className="documents-list">
                    <h1 style={{ marginBottom: '20px' }}>المستندات</h1>

                    <div className="document-item">
                        <span>كتاب الإيمان</span>
                        <span>٢٠٢٦/٠١/١٢</span>
                    </div>
                    <div className="document-item">
                        <span>باب النية</span>
                        <span>٢٠٢٦/٠١/١١</span>
                    </div>
                    <div className="document-item">
                        <span>شرح الأربعين</span>
                        <span>٢٠٢٦/٠١/١٠</span>
                    </div>
                </div>
            </body>
        </html>
    );
}
