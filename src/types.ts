import type { Observable } from 'rxjs';
import type { Draft } from 'immer';
import type { StateSelector, StateCreator, EqualityChecker, UseStore } from 'zustand';

// basic types
export type StateRecord = Record<string, any>;
export type ActionsRecord = Record<string, (...args: any) => void>;
export type ComputedRecord = Record<string, (state: any) => any>;

// utility types
export type ScopeReducer<State extends StateRecord> = (state: State, action: { type: keyof ActionsRecord; payload: any }) => State;
export type EffectBuilder = <T>(builder: (payload$: Observable<T>) => Observable<unknown>) => (payload: T) => void;
export type OmitDraftArg<F> = F extends (draft: Draft<any>, ...args: infer A) => void ? (...args: A) => void : never;

// builder types
export type ActionBuilder<State> = Record<string, (draft: Draft<State>, ...args: any[]) => void>;
export type ComputedBuilder<State> = Record<string, (state: State) => any>;
export type MethodBuilder<State extends StateRecord = {}, Actions = {}, Methods = {}> = (
  perform: {
    getActions: <M extends Module = Module<State, Actions, Methods>>(module?: M) => M extends Module<any, infer A, infer M> ? A & M : Actions & Methods;
    getState: <M extends Module = Module<State, Actions, Methods>>(module?: M) => M extends Module<infer S> ? S : State;
    getState$: <M extends Module = Module<State, Actions, Methods>>(module?: M) => M extends Module<infer S> ? Observable<S> : Observable<State>;
  },
  effect: EffectBuilder
) => Record<any, (...args: any[]) => any>;
export type MiddlewareBuilder<State extends StateRecord = {}> = (creator: StateCreator<State>) => StateCreator<State>;

export type GenAction<RawAction> = RawAction extends Record<string, any> ? { [K in keyof RawAction]: OmitDraftArg<RawAction[K]> } : never;
export type GenComputed<RawComputed> = RawComputed extends Record<string, (...args: any[]) => any> ? { [K in keyof RawComputed]: ReturnType<RawComputed[K]> } : never;

// core
export type RawModule<State extends StateRecord = {}> = {
  reducers: Record<string, (...args: any) => (state: State) => State>;
  computed: Record<string, (state: State) => any>;
  methodsBuilders: MethodBuilder[];
  middlewares: MiddlewareBuilder<State>[];
};

export type ModuleFactory<State extends StateRecord = {}, Actions = {}, Methods = {}, Computed = {}, ExcludedField extends string = never> = {
  actions: <A extends ActionBuilder<State>>(actions: A) => Omit<ModuleFactory<State, GenAction<A>, Methods, Computed, ExcludedField | 'actions'>, ExcludedField | 'actions'>;
  computed: <V extends ComputedBuilder<State>>(computed: V) => Omit<ModuleFactory<State, Actions, Methods, GenComputed<V>, ExcludedField | 'computed'>, ExcludedField | 'computed'>;
  methods: <M extends MethodBuilder<State, Actions, Methods>>(methods: M) => Omit<ModuleFactory<State, Actions, ReturnType<M> & Methods, Computed, ExcludedField>, ExcludedField>;
  middleware: <M extends MiddlewareBuilder<State>>(middleware: M) => Omit<ModuleFactory<State, Actions, Methods, Computed, ExcludedField>, ExcludedField>;
  build: () => Module<State, Actions, Methods, Computed>;
};

export type ScopeGetter<State extends StateRecord = any, Actions = {}, Methods = {}> = {
  getActions: () => Actions & Methods;
  getState: () => State;
  getState$: () => Observable<State>;
};

export type Module<State extends StateRecord = {}, Actions = {}, Methods = {}, Computed = {}> = {
  use: <SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>) => [SelectorResult, Actions & Methods];
  useState: <SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>) => SelectorResult;
  useActions: () => Actions & Methods;
  useComputed: () => Computed;
  useState$: () => Observable<State>;
  global: ScopeGetter<State, Actions, Methods>;
};

export type ModuleContext = Map<Module, Scope>;

export type Scope<State extends StateRecord = {}, Actions = {}, Methods = {}> = {
  store: UseStore<State>;
  actions: ActionsRecord;
  computed: ComputedRecord;
  state$: Observable<State> | null;
} & ScopeGetter<State, Actions, Methods>;
