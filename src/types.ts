import type { StateSelector, StateCreator, EqualityChecker, UseStore } from 'zustand';
import type { Draft } from 'immer';

/* Utility Types */
type OmitDraftArg<F> = F extends (draft: Draft<any>, ...args: infer A) => void ? (...args: A) => void : never;

type GenAction<RawAction> = RawAction extends Record<string, any> ? { [K in keyof RawAction]: OmitDraftArg<RawAction[K]> } : never;
type GenComputed<RawComputed> = RawComputed extends Record<string, (...args: any[]) => any> ? { [K in keyof RawComputed]: ReturnType<RawComputed[K]> } : never;

/* Basic Types */
export type StateRecord = Record<string, any>;
export type ActionsRecord = Record<string, (...args: any) => void>;
export type ComputedRecord = Record<string, (state: any) => any>;

export type Perform<State extends StateRecord, Actions extends ActionsRecord & DefaultActions<State>> = {
  getActions<M extends HooksModule<any> = HooksModule<State, Actions>>(module?: M): M extends HooksModule<any, infer A> ? A : never;
  getState<M extends HooksModule<any> = HooksModule<State, Actions>>(module?: M): M extends HooksModule<infer S> ? S : never;
};

/* Core Types */
export type ActionBuilder<State extends StateRecord> = Record<string, (draft: Draft<State>, ...args: any[]) => void>;
export type ComputedBuilder<State extends StateRecord> = Record<string, (state: State) => any>;
export type MethodBuilder<State extends StateRecord, Actions extends ActionsRecord & DefaultActions<State>> = (
  perform: Perform<State, Actions>
) => Record<any, (...args: any[]) => any>;
export type MiddlewareBuilder<State extends StateRecord> = (creator: StateCreator<State>) => StateCreator<State>;

export type RawModule<State extends StateRecord = {}, Actions extends ActionsRecord & DefaultActions<State> = DefaultActions<State>> = {
  computed: Record<string, (state: State) => any>;
  // "reducers" and "methodsBuilders" will be turned into actions
  reducers: Record<string, (...args: any) => (state: State) => State>;
  methodsBuilders: MethodBuilder<State, Actions>[];
  middlewares: MiddlewareBuilder<State>[];
  excludedFields: (keyof ModuleFactory)[];
};

export type ModuleFactory<
  State extends StateRecord = {},
  Actions extends ActionsRecord & DefaultActions<State> = DefaultActions<State>,
  Computed extends ComputedRecord = {},
  Excluded extends string = never
> = {
  actions<A extends ActionBuilder<State>>(actions: A): Omit<ModuleFactory<State, GenAction<A> & Actions, Computed, Excluded | 'actions'>, Excluded | 'actions'>;
  computed<C extends ComputedBuilder<State>>(computed: C): Omit<ModuleFactory<State, Actions, GenComputed<C>, Excluded | 'computed'>, Excluded | 'computed'>;
  methods<MB extends MethodBuilder<State, Actions>>(builder: MB): ModuleFactory<State, ReturnType<MB> & Actions, Computed, Excluded>;
  middleware<M extends MiddlewareBuilder<State>>(middleware: M): Omit<ModuleFactory<State, Actions, Computed, Excluded | 'middleware'>, Excluded | 'middleware'>;
  build(): HooksModule<State, Actions, Computed>;
};

export type HooksModule<State extends StateRecord = {}, Actions extends ActionsRecord = DefaultActions<State>, Computed extends ComputedRecord = {}> = {
  use<SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>): [SelectorResult, Actions];
  useState<SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>): SelectorResult;
  useActions(): Actions;
  useComputed(): Computed;
};

export type Scope<State extends StateRecord = {}, Actions extends ActionsRecord = DefaultActions<State>, Computed extends ComputedRecord = {}> = {
  store: UseStore<State>;
  getActions(context: ScopeContext): Actions;
  getComputed(): Computed;
  getState(): State;
};

export type ScopeBuildOption<State> = { defaultValue?: Partial<State>; middleware?: MiddlewareBuilder<State> };
export type ScopeRef = { current?: Scope<any, any>; buildOption?: ScopeBuildOption<any> };
export type ScopeContext = Map<HooksModule<any, any, any>, ScopeRef>;

export const buildScopeSymbol = Symbol('buildScope');

/* Auto setState, copied from solid-js/store/types */
/* Copyright (c) 2016-2019 Ryan Carniato */
type Part<T> = T extends any[] ? never : T extends object ? keyof T : never;
type NullableNext<T, K> = K extends keyof T ? T[K] : never;
type Next<T, K> = NonNullable<NullableNext<T, K>>;
type StoreSetter<T> = T | ((prevState: T) => T);

/* prettier-ignore */
export interface SetState<T> {
  <Setter extends StoreSetter<T>>(...args: [Setter]): void;
  <K1 extends Part<T>, Setter extends StoreSetter<NullableNext<T, K1>>>(...args: [K1, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, Setter extends StoreSetter<NullableNext<Next<T, K1>, K2>>>(...args: [K1, K2, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, K3 extends Part<Next<Next<T, K1>, K2>>, Setter extends StoreSetter<NullableNext<Next<Next<T, K1>, K2>, K3>>>(...args: [K1, K2, K3, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, K3 extends Part<Next<Next<T, K1>, K2>>, K4 extends Part<Next<Next<Next<T, K1>, K2>, K3>>, Setter extends StoreSetter<NullableNext<Next<Next<Next<T, K1>, K2>, K3>, K4>>>(...args: [K1, K2, K3, K4, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, K3 extends Part<Next<Next<T, K1>, K2>>, K4 extends Part<Next<Next<Next<T, K1>, K2>, K3>>, K5 extends Part<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>>, Setter extends StoreSetter<NullableNext<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>>>(...args: [K1, K2, K3, K4, K5, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, K3 extends Part<Next<Next<T, K1>, K2>>, K4 extends Part<Next<Next<Next<T, K1>, K2>, K3>>, K5 extends Part<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>>, K6 extends Part<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>>, Setter extends StoreSetter<NullableNext<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>, K6>>>(...args: [K1, K2, K3, K4, K5, K6, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, K3 extends Part<Next<Next<T, K1>, K2>>, K4 extends Part<Next<Next<Next<T, K1>, K2>, K3>>, K5 extends Part<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>>, K6 extends Part<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>>, K7 extends Part<Next<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>, K6>>, Setter extends StoreSetter<NullableNext<Next<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>>>(...args: [K1, K2, K3, K4, K5, K6, K7, Setter]): void;
  <K1 extends Part<T>, K2 extends Part<Next<T, K1>>, K3 extends Part<Next<Next<T, K1>, K2>>, K4 extends Part<Next<Next<Next<T, K1>, K2>, K3>>, K5 extends Part<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>>, K6 extends Part<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>>, K7 extends Part<Next<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>, K6>>, K8 extends Part<Next<Next<Next<Next<Next<Next<Next<T, K1>, K2>, K3>, K4>, K5>, K6>, K7>>>(...args: [K1, K2, K3, K4, K5, K6, K7, K8, ...(Part<any> | StoreSetter<any>)[]]): void;
}
export type DefaultActions<State> = { setState: SetState<State> };
