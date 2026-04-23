import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
  // Proxy removed for now. Will be added back when migrating to live HIBP API.
})
