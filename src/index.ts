import { extendActions, extendMethods, extendComputed, buildModule, extendMiddleware } from './builders';
import { omit } from './utils';
import { defineProvider } from './scope';
import type { ModuleFactory, RawModule, StateRecord } from './types';

const factory = (state: StateRecord, rawModule: RawModule, excluded: (keyof ModuleFactory)[] = []): ModuleFactory => {
  return {
    actions: (actions) => {
      const _excluded: (keyof ModuleFactory)[] = [...excluded, 'actions'];
      return omit(factory(state, extendActions(actions)(rawModule), _excluded), _excluded);
    },
    computed: (computed) => {
      const _excluded: (keyof ModuleFactory)[] = [...excluded, 'computed'];
      return omit(factory(state, extendComputed(computed)(rawModule), _excluded), _excluded);
    },
    methods: (methods) => {
      return factory(state, extendMethods(methods)(rawModule), excluded);
    },
    middleware: (middleware) => {
      return factory(state, extendMiddleware(middleware)(rawModule), excluded);
    },
    build: buildModule(state, rawModule),
  } as ModuleFactory;
};

const defineModule = <State extends StateRecord>(defaultState: State): ModuleFactory<State> => {
  return factory(defaultState, {
    reducers: {},
    computed: {},
    methodsBuilders: [],
    middlewares: [],
  }) as ModuleFactory<State>;
};

export { defineModule, defineProvider };
