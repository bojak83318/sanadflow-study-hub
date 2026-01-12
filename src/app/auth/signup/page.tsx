/**
 * Signup Page
 * Supabase Auth Registration Form with RTL support
 * 
 * @module src/app/auth/signup/page
 * @agent frontend-engineer
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function SignupPage() {
    const router = useRouter()
    const { signUp, loading, error } = useAuth()

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [formError, setFormError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        // Validation
        if (!email || !password || !fullName) {
            setFormError('يرجى ملء جميع الحقول المطلوبة')
            return
        }

        if (password !== confirmPassword) {
            setFormError('كلمتا المرور غير متطابقتين')
            return
        }

        if (password.length < 6) {
            setFormError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
            return
        }

        const result = await signUp(email, password, fullName)

        if (result.error) {
            setFormError(result.error.message)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2" dir="rtl">
                        تم إنشاء الحساب بنجاح!
                    </h2>
                    <p className="text-gray-600 mb-6" dir="rtl">
                        يمكنك الآن تسجيل الدخول والبدء في استخدام سند فلو.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        تسجيل الدخول
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900" dir="rtl">
                        إنشاء حساب جديد
                    </h1>
                    <p className="mt-2 text-sm text-gray-600" dir="rtl">
                        انضم إلى سند فلو لدراسة العلوم الإسلامية
                    </p>
                </div>

                {/* Error Message */}
                {(formError || error) && (
                    <div
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                        role="alert"
                        dir="rtl"
                    >
                        {formError || error?.message}
                    </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        {/* Full Name Field */}
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                dir="rtl"
                            >
                                الاسم الكامل
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                autoComplete="name"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="محمد أحمد"
                                dir="rtl"
                                lang="ar"
                                style={{ unicodeBidi: 'plaintext', textAlign: 'right' }}
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                dir="rtl"
                            >
                                البريد الإلكتروني
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="example@email.com"
                                dir="ltr"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                dir="rtl"
                            >
                                كلمة المرور
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="6 أحرف على الأقل"
                                dir="ltr"
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                dir="rtl"
                            >
                                تأكيد كلمة المرور
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="أعد إدخال كلمة المرور"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                جارٍ إنشاء الحساب...
                            </span>
                        ) : (
                            'إنشاء حساب'
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600" dir="rtl">
                        لديك حساب بالفعل؟{' '}
                        <Link
                            href="/auth/login"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
