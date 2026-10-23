// Vite config: React + Tailwind plugins, dev server on 8000,
// and /api requests forwarded to the Express server on 3000.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 8000,
        strictPort: true,                              // fail instead of silently using another port
        proxy: { '/api': 'http://localhost:3000' },    // fetch('/api/...') → Express
    },
});
