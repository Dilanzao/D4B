import { defineConfig } from 'vite';
import { APP_VERSION } from './src/config/app.js';

export default defineConfig({
  plugins: [{
    name: 'd4b-version-title',
    transformIndexHtml(html) { return html.replaceAll('__APP_VERSION__', APP_VERSION); }
  }],
  base: '/',
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['dofus4business.com.br']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
