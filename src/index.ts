import { extendActions, extendMethods, extendComputed, initInstance } from './builders';
import { omit } from './utils';
import type { Module, ModuleFactory, StateRecord } from './types';

const factory = (state: StateRecord, module: Module, excluded: (keyof ModuleFactory)[] = []): ModuleFactory => {
  return {
    actions: (actions) => {
      const _excluded: (keyof ModuleFactory)[] = [...excluded, 'actions'];
      return omit(factory(state, extendActions(actions)(module), _excluded), _excluded);
    },
    computed: (computed) => {
      const _excluded: (keyof ModuleFactory)[] = [...excluded, 'computed'];
      return omit(factory(state, extendComputed(computed)(module), _excluded), _excluded);
    },
    methods: (methods) => {
      return factory(state, extendMethods(methods)(module), excluded);
    },
    init: initInstance(state, module),
  } as ModuleFactory;
};

const defineModule = <State extends StateRecord>(defaultState: State): ModuleFactory<State> => {
  return factory(defaultState, { reducers: {}, computed: {}, methodsBuilders: [] }) as ModuleFactory<State>;
};

export { defineModule };
