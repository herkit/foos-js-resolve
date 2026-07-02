import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))
const API_TARGET = process.env.API_TARGET ?? 'http://localhost:3000'

// SPA build. Sources live in web/; the .jsx extension lets Vite handle JSX
// natively (no loader override, which would corrupt CommonJS deps). The reSolve
// client SDK package names are aliased to the local compatibility shim so
// component imports stay unchanged. Output goes to client-dist, which the
// NestJS app serves via ServeStaticModule.
export default defineConfig({
  root: resolvePath('web'),
  publicDir: resolvePath('web/static'),
  resolve: {
    alias: {
      '@resolve-js/react-hooks': resolvePath('web/client/resolve-compat/react-hooks.jsx'),
      '@resolve-js/redux': resolvePath('web/client/resolve-compat/redux.jsx'),
    },
  },
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/socket.io': { target: API_TARGET, ws: true, changeOrigin: true },
    },
  },
  build: {
    outDir: resolvePath('client-dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split large vendor groups into separate, cacheable chunks so the main
        // app chunk stays small.
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router',
            'react-router-dom',
            'react-redux',
            'redux',
          ],
          bootstrap: ['react-bootstrap'],
          charts: [
            'chart.js',
            'react-chartjs-2',
            'moment',
            'chartjs-adapter-moment',
          ],
        },
      },
    },
  },
})
