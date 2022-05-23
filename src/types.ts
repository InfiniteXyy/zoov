import type { StateSelector, StateCreator, EqualityChecker, StoreApi, UseBoundStore } from 'zustand';
import type { Draft } from 'immer';

/* Utility Types */
type OmitDraftArg<F> = F extends (draft: Draft<any>, ...args: infer A) => void ? (...args: A) => void : never;

type GenAction<RawAction> = RawAction extends Record<string, any> ? { [K in keyof RawAction]: OmitDraftArg<RawAction[K]> } : never;
type GenComputed<RawComputed> = RawComputed extends Record<string, (...args: any) => unknown> ? { [K in keyof RawComputed]: ReturnType<RawComputed[K]> } : never;

/* Basic Types */
export type StateRecord = Record<string, any>;
export type Reducer<State> = (...args: any) => (state: State) => State;
export type Action = (...args: any) => void;
export type ActionsRecord<State> = Record<string, Action> & { setState: SetState<State> };
export type ComputedRecord = Record<string, (state: any) => any>;

export type Perform<State extends StateRecord, Actions extends ActionsRecord<State>> = {
  getActions<M extends HooksModule<any> = HooksModule<State, Actions>>(module?: M): M extends HooksModule<any, infer A> ? A : never;
  getState<M extends HooksModule<any> = HooksModule<State, Actions>>(module?: M): M extends HooksModule<infer S> ? S : never;
};

/* Core Types */
export type ActionBuilder<State extends StateRecord> = Record<string, (draft: Draft<State>, ...args: any) => void>;
export type ComputedBuilder<State extends StateRecord> = Record<string, (state: State) => any>;
export type MethodBuilder<State extends StateRecord, Actions extends ActionsRecord<State>> = (perform: Perform<State, Actions>) => Record<any, (...args: any) => any>;
export type MiddlewareBuilder<State extends StateRecord> = (creator: StateCreator<State, any, any, any>) => StateCreator<State, any, any, any>;

export type RawModule<State extends StateRecord = {}, Actions extends ActionsRecord<State> = ActionsRecord<State>> = {
  computed: Record<string, (state: State) => any>;
  // "reducers" and "methodsBuilders" will be turned into actions
  reducers: Record<string, Reducer<State>>;
  methodsBuilders: MethodBuilder<State, Actions>[];
  middlewares: MiddlewareBuilder<State>[];
};

export type ModuleFactory<
  State extends StateRecord = {},
  Actions extends ActionsRecord<State> = ActionsRecord<State>,
  Computed extends ComputedRecord = {},
  Excluded extends string = never
> = {
  actions<A extends ActionBuilder<State>>(actions: A): Omit<ModuleFactory<State, GenAction<A> & Actions, Computed, Excluded | 'actions'>, Excluded | 'actions'>;
  computed<C extends ComputedBuilder<State>>(computed: C): Omit<ModuleFactory<State, Actions, GenComputed<C>, Excluded | 'computed'>, Excluded | 'computed'>;
  methods<MB extends MethodBuilder<State, Actions>>(builder: MB): ModuleFactory<State, ReturnType<MB> & Actions, Computed, Excluded>;
  middleware<M extends MiddlewareBuilder<State>>(middleware: M): Omit<ModuleFactory<State, Actions, Computed, Excluded | 'middleware'>, Excluded | 'middleware'>;
  build(): Omit<HooksModule<State, Actions, Computed>, typeof __buildScopeSymbol>;
};

export const __buildScopeSymbol = Symbol('buildScope');

export type Scope<State extends StateRecord = {}, Actions extends ActionsRecord<State> = ActionsRecord<State>, Computed extends ComputedRecord = {}> = {
  store: UseBoundStore<StoreApi<State>>;
  getActions(context: ScopeContext): Actions;
  getComputed(): Computed;
  getState(): State;
};

export type ScopeBuildOption<State> = { defaultValue?: Partial<State>; middleware?: MiddlewareBuilder<State> };
export type ScopeRef = { current?: Scope<any, any>; buildOption?: ScopeBuildOption<any> };
export type ScopeContext = Map<HooksModule<any, any, any>, ScopeRef>;

export type HooksModule<State extends StateRecord = {}, Actions extends ActionsRecord<State> = ActionsRecord<State>, Computed extends ComputedRecord = {}> = {
  use<SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>): [SelectorResult, Actions];
  useState<SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>): SelectorResult;
  useActions(): Actions;
  useComputed(): Computed;
  /** Retrieve state outside React components,
   *  note: By default, the return value will be the global module state.
   *        If you want to get "scope-inner" state, you must use the scope parameter.
   *        you can get the scope via hooks `useScopeContext()`
   */
  getState(scope?: ScopeContext): State;
  /** Retrieve actions outside React components,
   *  note: By default, the return value will be the global module state.
   *        If you want to get "scope-inner" actions, you must use the scope parameter.
   *        you can get the scope via hooks `useScopeContext()`
   */
  getActions(scope?: ScopeContext): Actions;
};

/* Auto setState, copied from solid-js/store/types */
/* Copyright (c) 2016-2019 Ryan Carniato */
type NotWrappable = string | number | bigint | symbol | boolean | Function | null | undefined;
type Part<T> = T extends any[] ? never : T extends object ? keyof T : never;
type NullableNext<T, K> = K extends keyof T ? T[K] : never;
type Next<T, K> = NonNullable<NullableNext<T, K>>;
type WrappableNext<T, K extends Part<T>> = Exclude<Next<T, K>, NotWrappable>;

export type StoreSetter<T> = T | ((prevState: T) => T);

/* prettier-ignore */
export interface SetState<T> {
  <K1 extends Part<T>, K2 extends Part<T1>, K3 extends Part<T2>, K4 extends Part<T3>, K5 extends Part<T4>, K6 extends Part<T5>, K7 extends Part<T6>, T1 extends WrappableNext<T, K1>, T2 extends WrappableNext<T1, K2>, T3 extends WrappableNext<T2, K3>, T4 extends WrappableNext<T3, K4>, T5 extends WrappableNext<T4, K5>, T6 extends WrappableNext<T5, K6> >( k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6, k7: K7, setter: StoreSetter<Next<T6, K7>>): void;
  <K1 extends Part<T>, K2 extends Part<T1>, K3 extends Part<T2>, K4 extends Part<T3>, K5 extends Part<T4>, K6 extends Part<T5>, T1 extends WrappableNext<T, K1>, T2 extends WrappableNext<T1, K2>, T3 extends WrappableNext<T2, K3>, T4 extends WrappableNext<T3, K4>, T5 extends WrappableNext<T4, K5> >( k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6, setter: StoreSetter<Next<T5, K6>> ): void;
  <K1 extends Part<T>, K2 extends Part<T1>, K3 extends Part<T2>, K4 extends Part<T3>, K5 extends Part<T4>, T1 extends WrappableNext<T, K1>, T2 extends WrappableNext<T1, K2>, T3 extends WrappableNext<T2, K3>, T4 extends WrappableNext<T3, K4> >( k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, setter: StoreSetter<Next<T4, K5>> ): void;
  <K1 extends Part<T>, K2 extends Part<T1>, K3 extends Part<T2>, K4 extends Part<T3>, T1 extends WrappableNext<T, K1>, T2 extends WrappableNext<T1, K2>, T3 extends WrappableNext<T2, K3> >( k1: K1, k2: K2, k3: K3, k4: K4, setter: StoreSetter<Next<T3, K4>> ): void;
  <K1 extends Part<T>, K2 extends Part<T1>, K3 extends Part<T2>, T1 extends WrappableNext<T, K1>, T2 extends WrappableNext<T1, K2> >( k1: K1, k2: K2, k3: K3, setter: StoreSetter<Next<T2, K3>> ): void;
  <K1 extends Part<T>, K2 extends Part<T1>, T1 extends WrappableNext<T, K1>>( k1: K1, k2: K2, setter: StoreSetter<Next<T1, K2>> ): void;
  <K extends Part<T>>(k: K, setter: StoreSetter<Next<T, K>>): void;
  (setter: StoreSetter<T>): void;
}
