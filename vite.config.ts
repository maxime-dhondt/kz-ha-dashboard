import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

// Single ES module bundle: dist/glass-home.js (this is what HACS serves).
export default defineConfig({
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
