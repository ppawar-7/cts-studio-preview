import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' && !process.env.LOCAL_E2E ? '/cts-studio-preview/' : '/'),
  server: {
    port: 5173,
  },
});
