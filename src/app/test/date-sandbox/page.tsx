/**
 * Date Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Date Picker RTL Tests
 * 
 * Tests RTL layout of date pickers with Arabic month names.
 * 
 * @module src/app/test/date-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function DateSandboxPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const currentMonth = new Date().getMonth();

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Date Sandbox - SanadFlow</title>
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
                        max-width: 400px;
                        margin: 100px auto;
                    }
                    
                    .date-picker {
                        position: relative;
                    }
                    
                    .date-input {
                        width: 100%;
                        padding: 15px 20px;
                        background: white;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 16px;
                        direction: rtl;
                        text-align: right;
                        cursor: pointer;
                    }
                    
                    .calendar {
                        position: absolute;
                        top: 100%;
                        right: 0;
                        width: 100%;
                        background: white;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        margin-top: 4px;
                        padding: 15px;
                        z-index: 100;
                    }
                    
                    .calendar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }
                    
                    .month-label {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    
                    .calendar-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                    }
                    
                    .day {
                        padding: 8px;
                        text-align: center;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                    
                    .day:hover {
                        background: #f0f0f0;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        منتقي التاريخ
                    </h1>

                    <div className="date-picker">
                        <input
                            data-testid="date-input"
                            className="date-input"
                            type="text"
                            value={selectedDate}
                            placeholder="اختر التاريخ"
                            onClick={() => setIsOpen(!isOpen)}
                            readOnly
                        />

                        {isOpen && (
                            <div className="calendar">
                                <div className="calendar-header">
                                    <button>◀</button>
                                    <span data-testid="month-label" className="month-label">
                                        {ARABIC_MONTHS[currentMonth]}
                                    </span>
                                    <button>▶</button>
                                </div>
                                <div className="calendar-grid">
                                    {Array.from({ length: 28 }, (_, i) => (
                                        <div
                                            key={i}
                                            className="day"
                                            onClick={() => {
                                                setSelectedDate(`${i + 1} ${ARABIC_MONTHS[currentMonth]}`);
                                                setIsOpen(false);
                                            }}
                                        >
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
