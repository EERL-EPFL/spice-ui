import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': process.env,
    },
    server: {
        allowedHosts: ['spice'],
        host: true,
    },
    base: './',
    build: {
        sourcemap: true,
    }
});
