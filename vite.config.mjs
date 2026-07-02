import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))
const API_TARGET = process.env.API_TARGET ?? 'http://localhost:3000'

// SPA build for the migrated frontend. The client sources use the .jsx extension
// so Vite handles JSX natively (dev scan, dev transform, and build) without any
// loader override — overriding the .js loader to jsx would corrupt CommonJS deps
// like react-moment. The reSolve client SDK packages are aliased to the local
// compatibility shim, so component imports stay unchanged. Output goes to the
// NestJS app (ServeStaticModule).
export default defineConfig({
  root: resolvePath('.'),
  publicDir: resolvePath('static'),
  resolve: {
    alias: {
      '@resolve-js/react-hooks': resolvePath('client/resolve-compat/react-hooks.jsx'),
      '@resolve-js/redux': resolvePath('client/resolve-compat/redux.jsx'),
    },
  },
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/socket.io': { target: API_TARGET, ws: true, changeOrigin: true },
    },
  },
  build: {
    outDir: resolvePath('nestjs/foos/client-dist'),
    emptyOutDir: true,
  },
})
