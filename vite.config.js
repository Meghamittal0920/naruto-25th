import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base: the build runs from any path, including /naruto-25th/ on GitHub Pages.
  base: './',
  plugins: [react()],
  server: { port: 5174, open: false },
});
