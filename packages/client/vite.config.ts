import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Low Code App',
        short_name: 'LowCode',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        description: 'A low-code platform with PWA support',
        icons: []
      }
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@assets': resolve(__dirname, './src/assets'),
      '@constants': resolve(__dirname, './src/constants'),
      '@styles': resolve(__dirname, './src/styles'),
      '@stores': resolve(__dirname, './src/stores'),
      '@utils': resolve(__dirname, './src/utils'),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://81.68.224.194:8080',
        changeOrigin: true,
        // Keep '/api' prefix so backend receives '/api/v1/...'
      },
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      // @ts-ignore
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0]
          }
        }
      }
    }
  }
})
