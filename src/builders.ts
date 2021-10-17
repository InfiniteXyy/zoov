import produce from 'immer';
import create from 'zustand';
import { redux } from 'zustand/middleware';
import { useScopeContext } from './context';
import { buildScopeSymbol, DefaultActions } from './types';

import type { EqualityChecker, StateCreator, StateSelector } from 'zustand';
import type { ActionsRecord, ComputedRecord, StateRecord, HooksModule, RawModule, ScopeContext, Scope } from './types';
import type { Perform, ScopeBuildOption, MethodBuilder, MiddlewareBuilder } from './types';

type ScopeReducer<State extends StateRecord> = (state: State, action: { type: string; payload: any }) => State;

export const extendActions = (actions: ActionsRecord, rawModule: RawModule<any, any>): RawModule<any, any> => {
  const reducers: any = {};
  Object.keys(actions).forEach((key) => {
    reducers[key] = (...args: any[]) => produce((draft) => void actions[key](draft, ...args));
  });
  return { ...rawModule, reducers, excludedFields: [...rawModule.excludedFields, 'actions'] };
};

export const extendComputed = (computed: ComputedRecord, rawModule: RawModule): RawModule => ({
  ...rawModule,
  computed,
  excludedFields: [...rawModule.excludedFields, 'computed'],
});

export const extendMethods = (builder: MethodBuilder<any, any>, rawModule: RawModule): RawModule => ({
  ...rawModule,
  methodsBuilders: [...rawModule.methodsBuilders, builder],
});

export const extendMiddleware = (middleware: MiddlewareBuilder<any>, rawModule: RawModule): RawModule => ({
  ...rawModule,
  middlewares: [...rawModule.middlewares, middleware],
  excludedFields: [...rawModule.excludedFields, 'middleware'],
});

const getScopeOrBuild = (context: ScopeContext, module: HooksModule<any, any>): Scope<any, any> => {
  if (!context.has(module)) context.set(module, {});
  const scopeRef = context.get(module)!;
  if (!scopeRef.current) scopeRef.current = (module as any)[buildScopeSymbol](scopeRef.buildOption);
  return scopeRef.current!;
};

export const buildModule =
  <State extends StateRecord, Actions extends ActionsRecord>(state: State, rawModule: RawModule<State, Actions & DefaultActions<State>>) =>
  (): HooksModule<State, Actions> => {
    const buildScope = (props?: ScopeBuildOption<State>): Scope<State, Actions> => {
      // this function keeps all essential build-module data with closure
      // it will be called when first used in a React Context
      // if the component was not wrapped in a React Context, it will use the global one
      const { defaultValue = {}, middleware } = props || {};

      const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => rawModule.reducers[type](...payload)(state);
      const stateCreator: StateCreator<State> = redux(scopeReducer, { ...state, ...defaultValue });
      const middlewares = middleware ? [middleware] : rawModule.middlewares;

      const computed: ComputedRecord = {};
      const cachedActionsMap = new WeakMap<ScopeContext, ActionsRecord>();

      const self: Scope<State, Actions> = {
        store: create(middlewares.reduce((acc, middleware) => middleware(acc), stateCreator)),
        getComputed: () => computed,
        getActions: (context: ScopeContext) => {
          const cachedAction = cachedActionsMap.get(context);
          if (cachedAction) return cachedAction as Actions & DefaultActions<State>;

          // build actions
          let actions = {} as Actions & DefaultActions<State>;

          // the default setState function
          actions.setState = (...args: any[]) => {
            const newState = produce((draft) => {
              const getters = args.slice(0, args.length - 1);
              const setter = args[args.length - 1];
              for (let i = 0; i < getters.length; i++) {
                if (i === getters.length - 1) {
                  if (typeof setter === 'function') {
                    draft[getters[i]] = setter(draft[getters[i]]);
                  } else {
                    draft[getters[i]] = setter;
                  }
                } else {
                  draft = draft[getters[i]];
                }
              }
            })(self.store.getState());
            self.store.setState(newState);
          };

          // bind Actions with dispatch, build methods
          const dispatch = self.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
          Object.keys(rawModule.reducers).forEach((key: keyof Actions & string) => {
            (actions[key] as any) = ((...args: any) => dispatch({ type: key, payload: args })) as Actions[typeof key];
          });
          const getScope = (module?: HooksModule<any, any>): Scope<any, any> => {
            if (!module) return self;
            return getScopeOrBuild(context, module);
          };
          const perform: Perform<State, Actions & DefaultActions<State>> = {
            getState: (module?: HooksModule) => getScope(module).getState(),
            getActions: (module?: HooksModule) => getScope(module).getActions(context),
          };
          rawModule.methodsBuilders.forEach((builder) => {
            actions = { ...actions, ...builder(perform) };
          });
          cachedActionsMap.set(context, actions);
          return actions;
        },
        getState: () => self.store.getState(),
      };
      // bind Computed
      Object.keys(rawModule.computed).forEach((key) => {
        Object.defineProperty(computed, key, {
          get: () => self.store(rawModule.computed[key]),
        });
      });

      return self;
    };

    const useScope = () => {
      const context = useScopeContext();
      return getScopeOrBuild(context, module);
    };

    const module: HooksModule<State, Actions> = {
      useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => useScope().store(selector, equalFn),
      useActions: () => useScope().getActions(useScopeContext()),
      useComputed: () => useScope().getComputed(),
      use: (...args: any) => [module.useState(...args), module.useActions()],
      [buildScopeSymbol]: buildScope,
    } as HooksModule<State, Actions>;

    return module;
  };
