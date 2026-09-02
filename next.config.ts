import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    tsconfigPath: './tsconfig.next.json',
  },
  webpack: (config, { isServer }) => {
    // Optimize chunk splitting for better caching and performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // React core
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-hook-form)[\\/]/,
              name: 'react-vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Radix UI and component libraries
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-vendors',
              priority: 9,
              reuseExistingChunk: true,
            },
            // Supabase
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase-vendors',
              priority: 8,
              reuseExistingChunk: true,
            },
            // Other node_modules
            libs: {
              test: /[\\/]node_modules[\\/]/,
              name: 'libs-vendors',
              priority: 7,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  compress: true,
};

export default nextConfig;
