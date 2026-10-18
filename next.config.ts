import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Keep SEO metadata in the initial head for HTML-only crawlers and audit tools.
  // Verify response/render timing when changing this: metadata is no longer streamed.
  htmlLimitedBots: /.*/,
  typescript: {
    tsconfigPath: './tsconfig.next.json',
  },
  webpack: (config, { webpack }) => {
    // Reused public pages retain Vite's public configuration names. Never
    // expose the server environment or the Supabase service-role key here.
    const publicEnv = {
      VITE_NEXT_SSR: true,
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
    // Preserve Next.js route-aware splitting. A single named vendor group
    // pulls libraries from unrelated routes into the initial page download.
    return config;
  },
  compress: true,
};

export default nextConfig;
