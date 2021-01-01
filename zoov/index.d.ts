import type { Draft } from 'immer';
import type { UseStore } from 'zustand';
import type { Observable } from 'rxjs';

// basic types
type StateRecord = Record<string | number | symbol, unknown>;

// utils
type EffectBuilder = <T>(builder: (payload$: Observable<T>) => Observable<unknown>) => (payload: T) => void;
type OmitDraftArg<F> = F extends (draft: Draft<any>, ...args: infer A) => void ? (...args: A) => void : never;

// builders
type ActionBuilder<State> = Record<string, (draft: Draft<State>, ...args: any[]) => void>;
type ViewBuilder<State> = Record<string, (state: State) => any>;
type MethodBuilder<State, Actions, Methods> = (self: { getActions: () => Actions & Methods; getState: () => State }, effect: EffectBuilder) => Record<any, (...args: any[]) => any>;

type GenHooks<RawState> = { [Key in keyof RawState & string as `use${Capitalize<Key>}`]: () => RawState[Key] };
type GenAction<RawAction> = RawAction extends Record<string, any> ? { [K in keyof RawAction]: OmitDraftArg<RawAction[K]> } : never;
type GenView<RawView> = RawView extends Record<string, (...args: any[]) => any> ? { [K in keyof RawView]: ReturnType<RawView[K]> } : never;

// Core
type InstanceOptions<State extends StateRecord> =
  | {
      // used for redux dev tools
      name?: string;
      // persist items in local storage
      persist?: string;
      // instance initial state
      state?: Partial<State>;
    }
  | string;

type Module<State extends StateRecord, Actions = {}, Methods = {}, Views = {}, ExcludedField extends string = never> = {
  actions: <A extends ActionBuilder<State>>(actions: A) => Omit<Module<State, GenAction<A>, Methods, Views, ExcludedField | 'actions'>, ExcludedField | 'actions'>;
  views: <V extends ViewBuilder<State>>(views: V) => Omit<Module<State, Actions, Methods, GenView<V>, ExcludedField | 'views'>, ExcludedField | 'views'>;
  methods: <M extends MethodBuilder<State, Actions, Methods>>(methods: M) => Module<State, Actions, ReturnType<M> & Methods, Views, ExcludedField>;
  init: (options?: InstanceOptions<State>) => Instance<State, Actions, Methods, Views>;
};

type Instance<State extends StateRecord, Actions, Methods, Views> = GenHooks<State> & GenHooks<Views> & { useActions: () => Actions & Methods; useState: UseStore<State> };

export const defineModule: () => { model: <State extends StateRecord>(defaultState: State) => Module<State> };
