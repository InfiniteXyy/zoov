import typescript from 'rollup-plugin-typescript2';

/** @type {import('rollup').RollupOptions} */
const options = {
  input: './src/index.ts',
  output: [
    { file: 'dist/zoov.js', format: 'commonjs', sourcemap: true },
    { file: 'dist/zoov.esm.js', format: 'esm', sourcemap: true },
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true,
    }),
  ],
  external: ['zustand', 'zustand/middleware', 'rxjs', 'immer', 'react'],
};

export default options;
