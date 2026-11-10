import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/atlas-test-facility/',
  plugins: [react()],
  server: { port: 5176, open: true },
  preview: { port: 4176 },
})
