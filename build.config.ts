import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  externals: ['zustand', 'zustand/middleware', 'rxjs', 'immer', 'react'],
});
