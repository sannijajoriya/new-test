
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Your Next.js configuration options here
    reactStrictMode: true, // Example option
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

module.exports = nextConfig;
