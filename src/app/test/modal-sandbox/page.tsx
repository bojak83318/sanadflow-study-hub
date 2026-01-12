/**
 * Modal Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Modal Dialog RTL Tests
 * 
 * Tests RTL layout in modal dialogs.
 * 
 * @module src/app/test/modal-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

export default function ModalSandboxPage() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Modal Sandbox - SanadFlow</title>
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
                        text-align: center;
                        padding-top: 100px;
                    }
                    
                    .open-btn {
                        padding: 15px 30px;
                        background: #4a69bd;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        cursor: pointer;
                    }
                    
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .modal {
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        max-width: 500px;
                        width: 90%;
                        direction: rtl;
                        text-align: right;
                    }
                    
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    
                    .close-btn {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    }
                    
                    .modal-content {
                        font-size: 18px;
                        line-height: 1.8;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <button
                        data-testid="open-modal"
                        className="open-btn"
                        onClick={() => setIsOpen(true)}
                    >
                        فتح النافذة
                    </button>
                </div>

                {isOpen && (
                    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                        <div
                            data-testid="rtl-modal"
                            className="modal"
                            dir="rtl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>عنوان النافذة</h2>
                                <button
                                    className="close-btn"
                                    onClick={() => setIsOpen(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-content">
                                هذا محتوى النافذة المنبثقة. يجب أن يظهر النص من اليمين إلى اليسار بشكل صحيح.
                            </div>
                        </div>
                    </div>
                )}
            </body>
        </html>
    );
}
