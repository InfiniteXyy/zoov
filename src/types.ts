import { Observable } from 'rxjs';
import { Draft } from 'immer';
import { UseStore } from 'zustand';
import type { PersistOptions } from './vendor';

// basic types
export type StateRecord = Record<string, unknown>;
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
  self: { getActions: () => Actions & Methods; getState: () => State },
  effect: EffectBuilder
) => Record<any, (...args: any[]) => any>;

export type GenAction<RawAction> = RawAction extends Record<string, any> ? { [K in keyof RawAction]: OmitDraftArg<RawAction[K]> } : never;
export type GenComputed<RawComputed> = RawComputed extends Record<string, (...args: any[]) => any> ? { [K in keyof RawComputed]: ReturnType<RawComputed[K]> } : never;

// core
export type Module<State extends StateRecord = {}> = {
  reducers: Record<string, (...args: any) => (state: State) => State>;
  computed: Record<string, (state: State) => any>;
  methodsBuilders: MethodBuilder[];
};

export type ModuleFactory<State extends StateRecord = {}, Actions = {}, Methods = {}, Computed = {}, ExcludedField extends string = never> = {
  actions: <A extends ActionBuilder<State>>(actions: A) => Omit<ModuleFactory<State, GenAction<A>, Methods, Computed, ExcludedField | 'actions'>, ExcludedField | 'actions'>;
  computed: <V extends ComputedBuilder<State>>(computed: V) => Omit<ModuleFactory<State, Actions, Methods, GenComputed<V>, ExcludedField | 'computed'>, ExcludedField | 'computed'>;
  methods: <M extends MethodBuilder<State, Actions, Methods>>(methods: M) => ModuleFactory<State, Actions, ReturnType<M> & Methods, Computed, ExcludedField>;
  init: (options?: InstanceOptions<State> | string) => Instance<State, Actions, Methods, Computed>;
};

export type InstanceOptions<State extends StateRecord> = {
  name?: string; // used for redux dev tools
  persist?: PersistOptions<State>; // persist items in local storage
  state?: Partial<State>; // instance initial state
};

export type Instance<State extends StateRecord, Actions, Methods, Computed> = { useActions: () => Actions & Methods; useState: UseStore<State>; useComputed: () => Computed };
