import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, requests to /api are forwarded to the Express server,
    // so the browser sees one origin and there are no CORS problems.
    proxy: { '/api': 'http://127.0.0.1:4000' },
  },
});
