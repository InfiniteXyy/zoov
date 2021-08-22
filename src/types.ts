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

export type Perform<State extends StateRecord, Actions extends ActionsRecord> = {
  getActions<M extends HooksModule<any> = HooksModule<State, Actions>>(module?: M): M extends HooksModule<any, infer A> ? A : never;
  getState<M extends HooksModule<any> = HooksModule<State, Actions>>(module?: M): M extends HooksModule<infer S> ? S : never;
};

/* Core Types */
export type ActionBuilder<State extends StateRecord> = Record<string, (draft: Draft<State>, ...args: any[]) => void>;
export type ComputedBuilder<State extends StateRecord> = Record<string, (state: State) => any>;
export type MethodBuilder<State extends StateRecord, Actions extends ActionsRecord> = (perform: Perform<State, Actions>) => Record<any, (...args: any[]) => any>;
export type MiddlewareBuilder<State extends StateRecord> = (creator: StateCreator<State>) => StateCreator<State>;

export type RawModule<State extends StateRecord = {}, Actions extends ActionsRecord = {}> = {
  computed: Record<string, (state: State) => any>;
  // "reducers" and "methodsBuilders" will be turned into actions
  reducers: Record<string, (...args: any) => (state: State) => State>;
  methodsBuilders: MethodBuilder<State, Actions>[];
  middlewares: MiddlewareBuilder<State>[];
  excludedFields: (keyof ModuleFactory)[];
};

export type ModuleFactory<State extends StateRecord = {}, Actions extends ActionsRecord = {}, Computed extends ComputedRecord = {}, Excluded extends string = never> = {
  actions<A extends ActionBuilder<State>>(actions: A): Omit<ModuleFactory<State, GenAction<A> & Actions, Computed, Excluded | 'actions'>, Excluded | 'actions'>;
  computed<C extends ComputedBuilder<State>>(computed: C): Omit<ModuleFactory<State, Actions, GenComputed<C>, Excluded | 'computed'>, Excluded | 'computed'>;
  methods<MB extends MethodBuilder<State, Actions>>(builder: MB): ModuleFactory<State, ReturnType<MB> & Actions, Computed, Excluded>;
  middleware<M extends MiddlewareBuilder<State>>(middleware: M): Omit<ModuleFactory<State, Actions, Computed, Excluded | 'middleware'>, Excluded | 'middleware'>;
  build(): HooksModule<State, Actions, Computed>;
};

export type HooksModule<State extends StateRecord = {}, Actions extends ActionsRecord = {}, Computed extends ComputedRecord = {}> = {
  use<SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>): [SelectorResult, Actions];
  useState<SelectorResult = State>(selector?: StateSelector<State, SelectorResult>, equalityFn?: EqualityChecker<SelectorResult>): SelectorResult;
  useActions(): Actions;
  useComputed(): Computed;
};

export type Scope<State extends StateRecord = {}, Actions extends ActionsRecord = {}, Computed extends ComputedRecord = {}> = {
  store: UseStore<State>;
  getActions(context: ScopeContext): Actions;
  getComputed(): Computed;
  getState(): State;
};

export type ScopeBuildOption<State> = { defaultValue?: Partial<State>; middleware?: MiddlewareBuilder<State> };
export type ScopeRef = { current?: Scope<any, any>; buildOption?: ScopeBuildOption<any> };
export type ScopeContext = Map<HooksModule<any, any, any>, ScopeRef>;

export const buildScopeSymbol = Symbol('buildScope');
