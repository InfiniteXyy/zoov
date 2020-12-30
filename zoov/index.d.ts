import type { Draft } from 'immer'
import type { UseStore } from 'zustand'

type StateRecord = Record<string | number | symbol, unknown>

type GenAction<RawAction> = RawAction extends Record<string, unknown> ? { [K in keyof RawAction]: OmitDraft<RawAction[K]> } : never
type OmitDraft<F> = F extends (draft: Draft<any>, ...args: infer A) => void ? (...args: A) => void : never

type GenView<RawView> = RawView extends Record<string, (...args: any) => any> ? { [K in keyof RawView]: ReturnType<RawView[K]> } : never

type GenHooks<S> = {
  [Key in keyof S & string as `use${Capitalize<Key>}`]: () => S[Key]
}

type Module<State extends StateRecord, Actions = {}, Views = {}> = {
  actions: <A extends Record<string, (draft: Draft<State>, ...args: any[]) => void>>(actions: A) => Module<State, GenAction<A>, Views>
  views: <V extends Record<string, (draft: State) => any>>(views: V) => Module<State, Actions, GenView<V>>
  init: (state?: Partial<State>) => Instance<State, Actions, Views>
}

type Instance<State extends StateRecord, Actions, Views> = GenHooks<State> & GenHooks<Views> & { useActions: () => Actions; useStore: UseStore<State> }

export const defineModule: () => { model: <State extends StateRecord>(state: State) => Module<State> }
