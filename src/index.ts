import { extendActions, extendMethods, extendComputed, buildModule, extendMiddleware } from './builders';
import { defineProvider } from './context';
import type { ModuleFactory, RawModule, StateRecord } from './types';

function factory<State extends StateRecord>(state: State, rawModule: RawModule<any, any>): ModuleFactory<State, any, any> {
  return {
    actions: (actions) => factory(state, extendActions(actions, rawModule)),
    computed: (computed) => factory(state, extendComputed(computed, rawModule)),
    methods: (methods) => factory(state, extendMethods(methods, rawModule)),
    middleware: (middleware) => factory(state, extendMiddleware(middleware, rawModule)),
    build: buildModule(state, rawModule),
  };
}

function defineModule<State extends StateRecord>(defaultState: State): ModuleFactory<State> {
  return factory(defaultState, {
    reducers: {},
    computed: {},
    methodsBuilders: [],
    middlewares: [],
    excludedFields: [],
  });
}

export { defineModule, defineProvider };

export const VERSION = '0.2.2';
