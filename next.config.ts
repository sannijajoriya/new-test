
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to fix a build warning from genkit about a missing optional dependency.
    if (isServer) {
        config.externals.push('@opentelemetry/exporter-jaeger');
        config.externals.push('@genkit-ai/firebase'); // Fix for build error
    }
    return config;
  },
};

export default nextConfig;

