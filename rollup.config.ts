import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';

const external = ['zustand', 'zustand/middleware', 'rxjs', 'immer', 'react', 'react-tracked'];

const createTypesConfig = (input) => {
  return defineConfig({
    input,
    external,
    output: { dir: 'dist' },
    plugins: [typescript({ tsconfig: './tsconfig.build.json', declaration: true, declarationDir: 'dist' })],
  });
};

const createBuildConfig = (input, name) => {
  return defineConfig({
    input,
    external,
    output: [
      { file: `./dist/esm/${name}.mjs`, format: 'es' },
      { file: `./dist/esm/${name}.js`, format: 'es' },
      { file: `./dist/${name}.js`, format: 'cjs' },
    ],
    plugins: [typescript({ tsconfig: './tsconfig.build.json', removeComments: true })],
  });
};

const entries = [
  { input: './src/index.ts', name: 'index' },
  { input: './src/effect.ts', name: 'effect' },
  { input: './src/tracked.ts', name: 'tracked' },
];
export default defineConfig(entries.flatMap(({ input, name }) => [createTypesConfig(input), createBuildConfig(input, name)]));
