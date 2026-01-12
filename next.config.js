/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force output to work correctly with Vercel
    output: undefined, // Use default (no static export)

    // Enable experimental features for App Router
    experimental: {
        // Server Actions are stable in Next.js 14
    },

    // Image optimization config
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },

    // TypeScript config
    typescript: {
        // Allow production builds even if there are type errors
        // (we catch these in CI anyway)
        ignoreBuildErrors: false,
    },

    // ESLint config
    eslint: {
        // Run ESLint on these directories during builds
        dirs: ['src'],
    },

    // Enable React strict mode
    reactStrictMode: true,

    // Webpack config for Arabic fonts and TLDraw
    webpack: (config) => {
        // Ensure proper handling of Arabic fonts
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
        })
        return config
    },
}

module.exports = nextConfig
