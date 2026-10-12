import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Content Security Policy for static hosting (the Express server sends the same policy as a header).
// Build-only: the dev server needs an inline script for React fast refresh.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://image.tmdb.org https://lh3.googleusercontent.com",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'"
].join('; ');

const cspMeta = {
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }]
};

export default defineConfig({
  plugins: [react(), cspMeta],
  server: { port: 3000 }
});
