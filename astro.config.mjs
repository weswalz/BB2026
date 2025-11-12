// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react()],
  site: 'https://biyuboxing.com',
  
  server: {
    host: '0.0.0.0',
    port: 4321
  },
  
  // Performance optimizations
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto'
  },
  
  // Image optimization settings
  image: {
    domains: ['biyuboxing.com'],
    remotePatterns: [
      {
        protocol: 'https'
      }
    ]
  },
  
  // Prefetch settings for better navigation performance
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  
  // Compression and optimization
  compressHTML: true,

  // Explicitly set public directory to avoid copying root files
  publicDir: './public',

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          // Manual chunking for better caching
          manualChunks: {
            'astro': ['astro'],
            'framework': ['@astrojs/internal-helpers']
          }
        }
      }
    }
  }
});