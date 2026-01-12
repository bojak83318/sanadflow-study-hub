/**
 * Auth Layout
 * Minimal layout for authentication pages
 * 
 * @module src/app/auth/layout
 */

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>{children}</body>
        </html>
    )
}
