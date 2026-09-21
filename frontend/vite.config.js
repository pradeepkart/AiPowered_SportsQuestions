import { defineConfig } from 'vite';

export default defineConfig({
  server: { proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true, timeout: 180000, proxyTimeout: 180000 } } },
  preview: { proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true, timeout: 180000, proxyTimeout: 180000 } } },
});
