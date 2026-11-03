import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Multipágina: la landing (/), la demo jugable (/play/) y las páginas legales.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        play: resolve(import.meta.dirname, 'play/index.html'),
        'aviso-legal': resolve(import.meta.dirname, 'aviso-legal.html'),
        privacidad: resolve(import.meta.dirname, 'privacidad.html'),
        cookies: resolve(import.meta.dirname, 'cookies.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
