import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))
const API_TARGET = process.env.API_TARGET ?? 'http://localhost:3000'

// SPA build for the migrated frontend. The whole client/ is written as JSX in
// .js files, so esbuild is configured with the jsx loader for those. The reSolve
// client SDK packages are aliased to the local compatibility shim, so component
// imports stay unchanged. Output goes to the NestJS app (ServeStaticModule).
export default defineConfig({
  root: resolvePath('.'),
  publicDir: resolvePath('static'),
  esbuild: {
    loader: 'jsx',
    include: /client\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  resolve: {
    alias: {
      '@resolve-js/react-hooks': resolvePath('client/resolve-compat/react-hooks.js'),
      '@resolve-js/redux': resolvePath('client/resolve-compat/redux.js'),
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
