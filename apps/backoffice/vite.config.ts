import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // Rule 2.1 (react-best-practices): Pre-bundle lucide-react so Vite doesn't
  // traverse its 1,500+ module barrel on every dev cold start. This is the
  // Vite equivalent of Next.js's `optimizePackageImports`.
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
