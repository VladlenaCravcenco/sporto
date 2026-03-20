import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Warn only if a single chunk exceeds 1 MB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loaded first, cached longest
          'vendor-react': ['react', 'react-dom', 'react-router'],
          // UI kit (Radix + shadcn)
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            'cmdk',
          ],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Animation
          'vendor-motion': ['motion'],
          // Charts & tables (admin only)
          'vendor-charts': ['recharts'],
          // File processing (admin import)
          'vendor-files': ['papaparse', 'xlsx'],
          // Email
          'vendor-email': ['@emailjs/browser'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // MUI (admin)
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  // SVG and CSV treated as asset URLs
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
