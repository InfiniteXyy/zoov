import { useMemo } from 'react';
import produce from 'immer';
import create from 'zustand';
import { redux } from 'zustand/middleware';
import { Observable } from 'rxjs';
import { useScopeContext, useScopeOr, BuildScopeSymbol } from './context';

import type { EqualityChecker, StateCreator, StateSelector } from 'zustand';
import type { ActionsRecord, ComputedRecord, StateRecord } from './types';
import type { HooksModule, RawModule, ScopeContext, Scope } from './types';
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

export const buildModule = <State extends StateRecord, Actions extends ActionsRecord>(state: State, rawModule: RawModule<State, Actions>) => (): HooksModule<State, Actions> => {
  const scopeBuilder = (props: ScopeBuildOption<State>): Scope<State, Actions> => {
    const { defaultValue = {}, middleware } = props;

    const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => rawModule.reducers[type](...payload)(state);
    const stateCreator: StateCreator<State> = redux(scopeReducer, { ...state, ...defaultValue });
    const middlewares = middleware ? [middleware] : rawModule.middlewares;

    const computed: ComputedRecord = {};
    let state$: Observable<State> | null = null;
    let cachedActions: ActionsRecord | null = null;
    const cachedActionsMap = new WeakMap<ScopeContext, ActionsRecord>();

    const self: Scope<State, Actions> = {
      store: create(middlewares.reduce((acc, middleware) => middleware(acc), stateCreator)),
      getComputed: () => computed,
      getActions: (context?: ScopeContext) => {
        const cachedAction = context ? cachedActionsMap.get(context) : cachedActions;
        if (cachedAction) return cachedAction as Actions;
        // build actions
        let actions = {} as Actions;
        // bind Actions with dispatch, build methods
        const dispatch = self.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
        Object.keys(rawModule.reducers).forEach((key: keyof Actions & string) => {
          actions[key] = ((...args: any) => dispatch({ type: key, payload: args })) as Actions[typeof key];
        });
        const getScope = (module?: HooksModule<any, any>): Scope<any, any> => {
          if (!module) return self;
          return context?.get(module) || module.globalScope;
        };
        const perform: Perform<State, Actions> = {
          getState: (module?: HooksModule) => getScope(module).getState(),
          getActions: (module?: HooksModule) => getScope(module).getActions(),
          getState$: (module?: HooksModule) => getScope(module).getState$() as any,
        };
        rawModule.methodsBuilders.forEach((builder) => {
          actions = { ...actions, ...builder(perform) };
        });
        if (context) {
          cachedActionsMap.set(context, actions);
        } else {
          cachedActions = actions;
        }
        return actions;
      },
      getState: () => self.store.getState(),
      getState$: () => {
        if (!state$) state$ = new Observable<State>((subscriber) => self.store.subscribe((state) => subscriber.next(state)));
        return state$;
      },
    };
    // bind Computed
    Object.keys(rawModule.computed).forEach((key) => {
      Object.defineProperty(computed, key, {
        get: () => self.store(rawModule.computed[key]),
      });
    });
    return self;
  };

  const globalScope = scopeBuilder({});
  const useScope = () => useScopeOr(module, globalScope);

  const module: HooksModule<State, Actions> = {
    use: (...args: any) => [module.useState(...args), module.useActions()],
    useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => useScope().store(selector, equalFn),
    useActions: () => {
      const context = useScopeContext();
      const scope = useScope();
      return useMemo(() => scope.getActions(context), [context]);
    },
    useComputed: () => useScope().getComputed(),
    useState$: () => useScope().getState$(),
    globalScope: globalScope,
    [BuildScopeSymbol]: scopeBuilder,
  } as HooksModule<State, Actions>;

  return module;
};
