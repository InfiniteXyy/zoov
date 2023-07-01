import type { Draft } from 'immer';
import type { StateCreator } from 'zustand';
import { expectType } from 'tsd';
import { defineModule, InferModule, useModule, useModuleActions, useModuleComputed } from '../src';
import { Observable } from 'rxjs';
import { effect } from '../src/effect';
import { useTrackedModule } from '../src/tracked';
import { ActionsRecord, SetState, __buildScopeSymbol } from '../src/types';

type ModuleState = { count: number };
type ModuleComputed = { doubled: number };
type ModuleActions = ActionsRecord<ModuleState> & { add: (count?: number) => void };
type ModuleMethods = { addAsync(count?: number): Promise<void> } & { methodWithThis(payload: string): void };

const module = defineModule<ModuleState>({ count: 0 })
  .actions({
    add: (state, count?: number) => {
      expectType<Draft<ModuleState>>(state);
      state.count += count || 1;
    },
  })
  .computed({
    doubled: (state) => {
      expectType<ModuleState>(state);
      return state.count * 2;
    },
  })
  .methods((self) => ({
    async addAsync(count?: number) {
      expectType<ModuleActions>(self.getActions());
      expectType<ModuleState>(self.getState());
      expectType<ModuleComputed>(self.getComputed());
      await Promise.resolve();
      self.getActions().add(count);
    },
  }))
  .methods({
    methodWithThis(_payload: string) {
      expectType<ModuleActions & Omit<ModuleMethods, 'methodWithThis'>>(this.getActions());
      expectType<ModuleState>(this.getState());
      expectType<ModuleComputed>(this.getComputed());
    },
  })
  .middleware((store) => {
    expectType<StateCreator<ModuleState, any, any, any>>(store);
    return store;
  })
  // subscription
  .subscribe((state) => {
    expectType<ModuleState>(state);
  })
  .subscribe({
    listener: (state) => {
      expectType<ModuleState>(state);
    },
    equalityFn: (state, newState) => {
      expectType<ModuleState>(state);
      expectType<ModuleState>(newState);
      return false;
    },
  })
  .subscribe({
    selector: (state) => {
      expectType<ModuleState>(state);
      return state.count;
    },
    listener: async (state, prevState, { addCleanup }) => {
      expectType<number>(state);
      expectType<number>(prevState);
      expectType<void>(addCleanup(() => {}));
    },
  })
  .build();

// state only
expectType<ModuleState>(module.useState());
// actions only
expectType<ModuleActions & ModuleMethods>(module.useActions());
expectType<ModuleActions & ModuleMethods>(useModuleActions(module));
// state selector
expectType<{ doubled: number }>(
  module.useState(
    (state) => ({ doubled: state.count * 2 }),
    (a, b) => {
      expectType<{ doubled: number }>(a);
      expectType<{ doubled: number }>(b);
      return a === b;
    }
  )
);
expectType<{ doubled: number }>(
  useModule(
    module,
    (state) => ({ doubled: state.count * 2 }),
    (a, b) => {
      expectType<{ doubled: number }>(a);
      expectType<{ doubled: number }>(b);
      return a === b;
    }
  )[0]
);
// computed
expectType<ModuleComputed>(module.useComputed());
expectType<ModuleComputed>(useModuleComputed(module));
// state and action composed
expectType<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>(module.use());
expectType<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>(useTrackedModule(module));
expectType<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>(useModule(module));
// @ts-expect-error
module.useActions().setState();
module.useActions().$setState('count', 2);

// effect
const fn = effect((payload) => {
  expectType<Observable<void>>(payload);
  return payload.pipe();
});
expectType<(payload: void) => void>(fn);

// internal actions
expectType<() => void>(module.useActions().$reset);
expectType<SetState<ModuleState>>(module.useActions().$setState);

// inference type utility
expectType<ModuleState>({} as InferModule<typeof module>['state']);
expectType<ModuleActions & ModuleMethods>({} as InferModule<typeof module>['actions']);
expectType<ModuleComputed>({} as InferModule<typeof module>['computed']);
