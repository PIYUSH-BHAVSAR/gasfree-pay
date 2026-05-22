import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Vite 8+ (Rolldown) NOT supported — keep Vite 5
// ugf-testnet-js needs Buffer/process/crypto in browser
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'crypto'],
      globals: { Buffer: true, process: true }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001'
    }
  }
})
