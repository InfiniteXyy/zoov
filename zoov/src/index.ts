import create, { UseStore, StateCreator } from 'zustand';
import { redux, devtools, persist } from 'zustand/middleware';
import produce, { Draft } from 'immer';
import { Observable, Subject } from 'rxjs';

// basic types
type StateRecord = Record<string, unknown>;
type ActionsRecord = Record<string, (...args: any) => void>;
type ViewsRecord = Record<string, (state: any) => any>;

// utils
type EffectBuilder = <T>(builder: (payload$: Observable<T>) => Observable<unknown>) => (payload: T) => void;
type OmitDraftArg<F> = F extends (draft: Draft<any>, ...args: infer A) => void ? (...args: A) => void : never;

// builders
type ActionBuilder<State> = Record<string, (draft: Draft<State>, ...args: any[]) => void>;
type ViewBuilder<State> = Record<string, (state: State) => any>;
type MethodBuilder<State, Actions = {}, Methods = {}> = (
  self: { getActions: () => Actions & Methods; getState: () => State },
  effect: EffectBuilder
) => Record<any, (...args: any[]) => any>;

type GenHooks<RawState> = { [Key in keyof RawState & string as `use${Capitalize<Key>}`]: () => RawState[Key] };
type GenAction<RawAction> = RawAction extends Record<string, any> ? { [K in keyof RawAction]: OmitDraftArg<RawAction[K]> } : never;
type GenView<RawView> = RawView extends Record<string, (...args: any[]) => any> ? { [K in keyof RawView]: ReturnType<RawView[K]> } : never;

// Core
type InstanceOptions<State extends StateRecord> = {
  // used for redux dev tools
  name?: string;
  // persist items in local storage
  persist?: string;
  // instance initial state
  state?: Partial<State>;
};

type Module<State extends StateRecord, Actions = {}, Methods = {}, Views = {}, ExcludedField extends string = never> = {
  actions: <A extends ActionBuilder<State>>(actions: A) => Omit<Module<State, GenAction<A>, Methods, Views, ExcludedField | 'actions'>, ExcludedField | 'actions'>;
  views: <V extends ViewBuilder<State>>(views: V) => Omit<Module<State, Actions, Methods, GenView<V>, ExcludedField | 'views'>, ExcludedField | 'views'>;
  methods: <M extends MethodBuilder<State, Actions, Methods>>(methods: M) => Module<State, Actions, ReturnType<M> & Methods, Views, ExcludedField>;
  init: (options?: InstanceOptions<State> | string) => Instance<State, Actions, Methods, Views>;
};

type Instance<State extends StateRecord, Actions, Methods, Views> = GenHooks<State> & GenHooks<Views> & { useActions: () => Actions & Methods; useState: UseStore<State> };

function capitalize(content: string): string {
  return content.charAt(0).toUpperCase() + content.slice(1);
}

function validateNaming(object: Record<string, unknown>): void {
  if (Object.keys(object).some((key) => key === 'actions' || key === 'store')) {
    throw new Error('key cannot be Store or Actions');
  }
}

function effect<P>(builder: (payload$: Observable<P>) => Observable<unknown>): (payload: P) => void {
  const subject = new Subject<P>();
  builder(subject).subscribe();
  return (payload) => subject.next(payload);
}

function defineModule() {
  return {
    model<State extends StateRecord>(state: State): Module<State> {
      validateNaming(state);

      let reducers: Record<keyof ActionsRecord, (...args: any) => (state: State) => State> = {};
      let computed: ViewsRecord = {};
      let methodsBuilders: MethodBuilder<State>[] = [];

      const scopeReducer = (state: State, { type, payload }: { type: keyof ActionsRecord; payload: any }) => reducers[type](...payload)(state);

      const module = {
        actions: (_actions: ActionsRecord) => {
          Object.keys(_actions).forEach((key: keyof ActionsRecord) => {
            reducers[key] = (...args) =>
              produce((draft) => {
                _actions[key](draft, ...args);
              });
          });
          const { actions, ...others } = module;
          return others;
        },
        views: (_views: ViewsRecord) => {
          validateNaming(_views);
          computed = _views;
          const { views, ...others } = module;
          return others;
        },
        methods: (builder: MethodBuilder<State>) => {
          methodsBuilders.push(builder);
          return module;
        },
        init: (_options: InstanceOptions<State> | string = {}) => {
          const options = typeof _options === 'string' ? { name: _options } : _options;
          const { persist: persistId, name: moduleName, state: currentState = {} } = options;

          let stateCreator: StateCreator<State> = redux(scopeReducer, { ...state, ...currentState });
          if (persistId) stateCreator = persist(stateCreator, { name: persistId });
          if (process.env.NODE_ENV === 'development') stateCreator = devtools(stateCreator, moduleName);

          const scope: { store: UseStore<State>; actions: ActionsRecord; stateHooks: ViewsRecord } = {
            store: create(stateCreator),
            actions: {},
            stateHooks: {},
          };

          const self = {
            getActions: () => scope.actions,
            getState: () => scope.store.getState(),
          };

          // build methods
          const dispatch = scope.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
          Object.keys(reducers).forEach((key) => {
            scope.actions[key] = (...args) => dispatch({ type: key, payload: args });
          });
          methodsBuilders.forEach((builder) => {
            scope.actions = { ...scope.actions, ...builder(self, effect) };
          });

          // build state, view hooks
          Object.keys(state).forEach((key) => {
            const selector = (state: State) => state[key];
            scope.stateHooks[`use${capitalize(key)}`] = () => scope.store(selector);
          });
          Object.keys(computed).forEach((key) => {
            scope.stateHooks[`use${capitalize(key)}`] = () => scope.store(computed[key]);
          });

          return {
            ...scope.stateHooks,
            useActions: () => scope.actions,
            useState: scope.store,
          };
        },
      };
      return module as any;
    },
  };
}

export { defineModule };
