/**
 * Toast Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Toast Notification RTL Tests
 * 
 * Tests RTL layout in toast notifications.
 * 
 * @module src/app/test/toast-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

export default function ToastSandboxPage() {
    const [showToast, setShowToast] = useState(false);

    const triggerToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Toast Sandbox - SanadFlow</title>
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
                    
                    .trigger-btn {
                        padding: 15px 30px;
                        background: #4a69bd;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        cursor: pointer;
                    }
                    
                    .toast {
                        position: fixed;
                        top: 20px;
                        left: 20px;
                        background: #27ae60;
                        color: white;
                        padding: 15px 25px;
                        border-radius: 8px;
                        font-size: 16px;
                        direction: rtl;
                        text-align: right;
                        animation: slideIn 0.3s ease;
                    }
                    
                    @keyframes slideIn {
                        from {
                            transform: translateX(-100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <button
                        data-testid="trigger-toast"
                        className="trigger-btn"
                        onClick={triggerToast}
                    >
                        إظهار الإشعار
                    </button>
                </div>

                {showToast && (
                    <div
                        data-testid="toast"
                        className="toast"
                        dir="rtl"
                    >
                        تم حفظ التغييرات بنجاح ✓
                    </div>
                )}
            </body>
        </html>
    );
}
