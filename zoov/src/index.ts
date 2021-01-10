import { extendActions, extendMethods, extendViews, initInstance } from './builders';
import { omit } from './utils';
import type { Module, ModuleFactory, StateRecord } from './types';

const factory = (state: StateRecord, module: Module, excluded: (keyof ModuleFactory)[] = []): ModuleFactory => {
  return {
    actions: (actions) => {
      const _excluded: (keyof ModuleFactory)[] = [...excluded, 'actions'];
      return omit(factory(state, extendActions(actions)(module), _excluded), _excluded);
    },
    views: (views) => {
      const _excluded: (keyof ModuleFactory)[] = [...excluded, 'views'];
      return omit(factory(state, extendViews(views)(module), _excluded), _excluded);
    },
    methods: (methods) => {
      return factory(state, extendMethods(methods)(module), excluded);
    },
    init: initInstance(state, module),
  } as ModuleFactory;
};

const defineModule = () => ({
  model<State extends StateRecord>(defaultState: State): ModuleFactory<State> {
    return factory(defaultState, { reducers: {}, computed: {}, methodsBuilders: [] }) as ModuleFactory<State>;
  },
});

export { defineModule };
