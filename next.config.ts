import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    tsconfigPath: './tsconfig.next.json',
  },
  webpack: (config, { isServer, webpack }) => {
    // Reused public pages retain Vite's public configuration names. Never
    // expose the server environment or the Supabase service-role key here.
    const publicEnv = {
      VITE_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      VITE_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VITE_ADMIN_LOGIN_EMAIL: process.env.VITE_ADMIN_LOGIN_EMAIL,
      VITE_EMAILJS_PUBLIC_KEY: process.env.VITE_EMAILJS_PUBLIC_KEY,
      VITE_EMAILJS_SERVICE_ID: process.env.VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_WELCOME: process.env.VITE_EMAILJS_TEMPLATE_WELCOME,
      VITE_EMAILJS_TEMPLATE_ADMIN: process.env.VITE_EMAILJS_TEMPLATE_ADMIN,
    };
    config.plugins.push(new webpack.DefinePlugin({
      'import.meta.env': JSON.stringify(publicEnv),
    }));
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
