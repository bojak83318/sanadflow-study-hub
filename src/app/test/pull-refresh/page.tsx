/**
 * Pull-to-Refresh Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Mobile Pull Gesture Tests
 * 
 * Tests pull-to-refresh gesture behavior.
 * 
 * @module src/app/test/pull-refresh/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

export default function PullRefreshPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setLastRefresh(new Date());
        }, 1500);
    };

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Pull Refresh - SanadFlow</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        margin: 0;
                        padding: 0;
                        min-height: 100vh;
                        overscroll-behavior-y: contain;
                    }
                    
                    .refresh-indicator {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: #4a69bd;
                        color: white;
                        text-align: center;
                        padding: 15px;
                        font-size: 16px;
                        z-index: 100;
                    }
                    
                    .refresh-content {
                        padding: 20px;
                        padding-top: 60px;
                    }
                    
                    .card {
                        background: white;
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    
                    .last-refresh {
                        text-align: center;
                        color: #666;
                        margin-bottom: 20px;
                    }
                `}</style>
            </head>
            <body>
                {isRefreshing && (
                    <div data-testid="refresh-indicator" className="refresh-indicator">
                        جارٍ التحديث...
                    </div>
                )}

                <div
                    data-testid="refresh-content"
                    className="refresh-content"
                    onTouchStart={(e) => {
                        const startY = e.touches[0].clientY;
                        const handleMove = (moveEvent: TouchEvent) => {
                            const currentY = moveEvent.touches[0].clientY;
                            if (currentY - startY > 80 && window.scrollY === 0) {
                                handleRefresh();
                            }
                        };
                        document.addEventListener('touchmove', handleMove, { once: true });
                    }}
                >
                    <h1 style={{ textAlign: 'center' }}>اسحب للتحديث</h1>

                    {lastRefresh && (
                        <div className="last-refresh">
                            آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')}
                        </div>
                    )}

                    <div className="card">
                        <h3>العنصر الأول</h3>
                        <p>هذا نص تجريبي للعنصر الأول في القائمة</p>
                    </div>

                    <div className="card">
                        <h3>العنصر الثاني</h3>
                        <p>هذا نص تجريبي للعنصر الثاني في القائمة</p>
                    </div>

                    <div className="card">
                        <h3>العنصر الثالث</h3>
                        <p>هذا نص تجريبي للعنصر الثالث في القائمة</p>
                    </div>
                </div>
            </body>
        </html>
    );
}
