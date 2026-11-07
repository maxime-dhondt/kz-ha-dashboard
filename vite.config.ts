import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

// Single ES module bundle: dist/glass-home.js (this is what HACS serves).
export default defineConfig({
  // Dev preview only: the example points at HA's /local/glass-home/ folder, serve it from examples/.
  plugins: [
    {
      name: 'glass-local-alias',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.startsWith('/local/glass-home/')) {
            req.url = req.url.replace('/local/glass-home/', '/examples/');
          }
          next();
        });
      },
    },
  ],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  build: {
    target: 'es2021',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/glass-home.ts',
      formats: ['es'],
      fileName: () => 'glass-home.js',
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
