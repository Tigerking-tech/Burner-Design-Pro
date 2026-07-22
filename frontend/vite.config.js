import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3002,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: function (path) { return path; },
            },
            '/health': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: function (path) { return path; },
            },
        },
    },
});
