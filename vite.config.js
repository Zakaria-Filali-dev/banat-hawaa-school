import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // Exit if port is already in use instead of trying another port
    host: true, // Listen on all addresses
    hmr: {
      // Reduce HMR polling for better stability
      overlay: true,
    },
    // Add timeout and keepalive settings
    timeout: 120000, // 2 minutes
    cors: true,
    // Handle memory issues
    watch: {
      usePolling: false, // Disable polling for better performance
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  // Optimize build performance and fix Supabase compatibility
  optimizeDeps: {
    include: [
      '@supabase/supabase-js'
    ],
    exclude: [],
    // Force pre-bundling of problematic modules
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Handle memory issues during development
  define: {
    global: 'globalThis',
  },
  // Build configuration for better compatibility
  build: {
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
})
