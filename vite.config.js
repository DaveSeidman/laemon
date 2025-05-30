import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/laemon/',
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  server: {
    port: 8080,
  },
});
