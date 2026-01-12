/**
 * Root Layout for SanadFlow Study Hub
 * Configuration for the entire application
 * 
 * @module src/app/layout
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SanadFlow Study Hub',
    description: 'Islamic Sciences Collaborative Platform with RTL Support',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{
                fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
                margin: 0,
                padding: 0,
            }}>
                {children}
            </body>
        </html>
    );
}
