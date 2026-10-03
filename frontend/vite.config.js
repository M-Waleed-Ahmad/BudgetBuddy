import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Splits the heavy third-party libraries into their own long-term cacheable chunks.
function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined;
  if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'echarts';
  if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
  if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
  return undefined;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express backend during development so the frontend
    // can use same-origin `/api/...` URLs (see VITE_API_URL in .env.example).
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // The tree-shaken ECharts core is ~550 kB minified (~185 kB gzip) and is only fetched by
    // the lazily-loaded pages that draw charts, so the default 500 kB warning is just noise.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
});
