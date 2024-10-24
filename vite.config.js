import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Vite will output the build files in the 'dist' folder
    rollupOptions: {
      output: {
        manualChunks: undefined,  // Keep chunks together for static deployment
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',  // Allows aliasing `@/assets/...` to refer to `src/assets`
    },
  },
  server: {
    port: 3000,  // Optional: Ensure dev server is on the correct port
  },
});
