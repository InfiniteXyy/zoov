import produce from 'immer';
import create from 'zustand';
import { redux } from 'zustand/middleware';
import { globalContext, useScopeContext } from './context';
import { __buildScopeSymbol } from './types';
import { simpleMemoizedFn } from './utils';

import type { EqualityChecker, StateCreator, StateSelector } from 'zustand';
import type { ComputedRecord, StateRecord, HooksModule, RawModule, ScopeContext, Scope, Reducer } from './types';
import type { Perform, ScopeBuildOption, MethodBuilder, MiddlewareBuilder, Action, ActionsRecord } from './types';

export function extendActions<State extends StateRecord, Actions extends ActionsRecord<State>>(
  rawActions: Actions,
  rawModule: RawModule<State, Actions>
): RawModule<State, Actions> {
  const reducerKeys: (keyof Actions)[] = Object.keys(rawActions);
  const reducers = reducerKeys.reduce((acc, key) => {
    acc[key] = (...args: unknown[]) => produce((draft) => void rawActions[key](draft, ...args));
    return acc;
  }, {} as Record<keyof Actions, Reducer<State>>);
  return { ...rawModule, reducers };
}

export function extendComputed(computed: ComputedRecord, rawModule: RawModule): RawModule {
  return { ...rawModule, computed };
}

export function extendMethods<State extends StateRecord, Actions extends ActionsRecord<State>>(builder: MethodBuilder<State, Actions>, rawModule: RawModule): RawModule {
  return { ...rawModule, methodsBuilders: [...rawModule.methodsBuilders, builder] };
}

export function extendMiddleware<State extends StateRecord>(middleware: MiddlewareBuilder<State>, rawModule: RawModule<State>): RawModule<State> {
  return { ...rawModule, middlewares: [...rawModule.middlewares, middleware] };
}

function getScopeOrBuild<State extends StateRecord, Actions extends ActionsRecord<State>>(context: ScopeContext, module: HooksModule<State, Actions>): Scope<State, Actions> {
  let scopeRef = context.get(module);
  if (!scopeRef) {
    scopeRef = {};
    context.set(module, scopeRef);
  }
  return (scopeRef.current ??= (module as any)[__buildScopeSymbol](scopeRef.buildOption));
}

export function buildModule<State extends StateRecord, Actions extends ActionsRecord<State>>(state: State, rawModule: RawModule<State, Actions & ActionsRecord<State>>) {
  return (): HooksModule<State, Actions> => {
    const buildScope = (props?: ScopeBuildOption<State>): Scope<State, Actions> => {
      // this function keeps all essential module data within the closure
      // it will be called when first used inside a Context
      // if the component was not wrapped in a "Zoov Context", it will use the global one
      const { defaultValue = {}, middleware } = props || {};

      type ScopeReducer<State extends StateRecord> = (state: State, action: { type: string; payload: unknown[] }) => State;

      const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => rawModule.reducers[type](...payload)(state);
      const stateCreator: StateCreator<any, any, any> = redux(scopeReducer, { ...state, ...defaultValue });
      const middlewares = middleware ? [middleware] : rawModule.middlewares;

      const computed: ComputedRecord = {};
      const cachedActionsMap = new WeakMap<ScopeContext, ActionsRecord<State>>();

      const self: Scope<State, Actions> = {
        store: create(middlewares.reduce((acc, middleware) => middleware(acc), stateCreator)),
        getComputed: () => computed,
        getActions: (context: ScopeContext) => {
          const cachedAction = cachedActionsMap.get(context);
          if (cachedAction) return cachedAction as Actions & ActionsRecord<State>;

          // build actions
          let actions = {} as Actions & ActionsRecord<State>;

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
          const dispatch = self.store.getState().dispatch as (payload: { type: keyof ActionsRecord<State>; payload: any }) => void;
          Object.keys(rawModule.reducers).forEach((key: keyof Actions & string) => {
            actions[key] = ((...args: any) => dispatch({ type: key, payload: args })) as Actions[typeof key];
          });
          const getScope = (module?: HooksModule<any, any>): Scope<any, any> => {
            if (!module) return self;
            return getScopeOrBuild(context, module);
          };
          let isBuildingMethods = false;
          const perform: Perform<State, Actions & ActionsRecord<State>> = {
            getState: (module?: HooksModule) => getScope(module).getState(),
            getActions: (module?: HooksModule) => {
              if (isBuildingMethods) throw new Error('should not call getActions in a builder function, getActions in a methods instead');
              return getScope(module).getActions(context);
            },
          };
          isBuildingMethods = true;
          rawModule.methodsBuilders.forEach((builder) => {
            actions = { ...actions, ...builder(perform) };
          });
          isBuildingMethods = false;
          cachedActionsMap.set(context, actions);
          return actions;
        },
        getState: () => self.store.getState(),
      };

      // bind Computed
      Object.keys(rawModule.computed).forEach((key) => {
        rawModule.computed[key] = simpleMemoizedFn(rawModule.computed[key]);
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

    const module = {
      use: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => [module.useState(selector, equalFn), module.useActions(), module.useComputed()],
      useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => useScope().store(selector, equalFn),
      useActions: () => useScope().getActions(useScopeContext()),
      useComputed: () => useScope().getComputed(),
      getState: (context = globalContext) => getScopeOrBuild(context, module).getState(),
      getActions: (context = globalContext) => getScopeOrBuild(context, module).getActions(context),
      [__buildScopeSymbol]: buildScope,
    } as HooksModule<State, Actions>;

    return module;
  };
}
