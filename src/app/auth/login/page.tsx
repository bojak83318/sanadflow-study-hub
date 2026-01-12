/**
 * Login Page
 * Supabase Auth Login Form with RTL support
 * 
 * @module src/app/auth/login/page
 * @agent frontend-engineer
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'

    const { signIn, loading, error } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [formError, setFormError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        if (!email || !password) {
            setFormError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
            return
        }

        const result = await signIn(email, password)

        if (result.error) {
            setFormError(result.error.message)
        } else {
            router.push(redirectTo)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900" dir="rtl">
                        مرحباً بك في سند فلو
                    </h1>
                    <p className="mt-2 text-sm text-gray-600" dir="rtl">
                        سجّل الدخول للوصول إلى مساحة العمل
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

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
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
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="••••••••"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                            dir="rtl"
                        >
                            نسيت كلمة المرور؟
                        </Link>
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
                                جارٍ تسجيل الدخول...
                            </span>
                        ) : (
                            'تسجيل الدخول'
                        )}
                    </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600" dir="rtl">
                        ليس لديك حساب؟{' '}
                        <Link
                            href="/auth/signup"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            إنشاء حساب جديد
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
