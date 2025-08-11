import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        allowedHosts: ['spice'],
        host: true,
    },
    base: './',
    build: {
        sourcemap: true,
        target: 'esnext',
    },
    define: {
        // Polyfill for crypto.randomUUID in development
        global: 'globalThis',
    }
});
