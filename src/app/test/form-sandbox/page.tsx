/**
 * Form Sandbox Page for Playwright Testing
 * Phase 0: RTL Validation - Form Elements RTL Tests
 * 
 * Tests form validation, dropdown menus, and RTL form layouts.
 * 
 * @module src/app/test/form-sandbox/page
 * @agent qa-engineer
 */

'use client';

import React, { useState } from 'react';

export default function FormSandboxPage() {
    const [email, setEmail] = useState('');
    const [grading, setGrading] = useState('');
    const [showError, setShowError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setShowError(true);
        }
    };

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>Form Sandbox - SanadFlow</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    
                    body {
                        font-family: 'Amiri', serif;
                        background: #f5f5f5;
                        direction: rtl;
                        padding: 20px;
                    }
                    
                    .form-container {
                        max-width: 500px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    
                    .form-group {
                        margin-bottom: 20px;
                    }
                    
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: bold;
                        direction: rtl;
                        text-align: right;
                    }
                    
                    input, select {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 16px;
                        direction: rtl;
                        text-align: right;
                    }
                    
                    input:focus, select:focus {
                        outline: none;
                        border-color: #4a69bd;
                    }
                    
                    .submit-btn {
                        width: 100%;
                        padding: 12px;
                        background: #4a69bd;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-family: 'Amiri', serif;
                        font-size: 18px;
                        cursor: pointer;
                    }
                    
                    .submit-btn:hover {
                        background: #3a5ba9;
                    }
                    
                    .error-message {
                        color: #e74c3c;
                        margin-top: 10px;
                        direction: rtl;
                        text-align: right;
                    }
                `}</style>
            </head>
            <body>
                <div className="form-container">
                    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        نموذج الاختبار
                    </h1>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email" dir="rtl">
                                البريد الإلكتروني
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="أدخل بريدك الإلكتروني"
                                dir="rtl"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="grading" dir="rtl">
                                درجة الحديث
                            </label>
                            <select
                                id="grading"
                                data-testid="grading-select"
                                value={grading}
                                onChange={(e) => setGrading(e.target.value)}
                                dir="rtl"
                            >
                                <option value="">اختر الدرجة</option>
                                <option value="sahih">صحيح</option>
                                <option value="hasan">حسن</option>
                                <option value="daif">ضعيف</option>
                                <option value="mawdu">موضوع</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            data-testid="submit-btn"
                            className="submit-btn"
                        >
                            إرسال
                        </button>

                        {showError && (
                            <div
                                data-testid="error-message"
                                className="error-message"
                                dir="rtl"
                            >
                                الرجاء إدخال البريد الإلكتروني
                            </div>
                        )}
                    </form>
                </div>
            </body>
        </html>
    );
}
