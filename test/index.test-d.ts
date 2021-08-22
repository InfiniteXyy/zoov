import type { Draft } from 'immer';
import type { StateCreator, SetState } from 'zustand';
import { expectType } from 'tsd';
import { defineModule } from '../src';

type ModuleState = { count: number };
type ModuleComputed = { doubled: number };
type ModuleActions = { add: (count?: number) => void };
type ModuleMethods = { addAsync(count?: number): Promise<void> };

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
      await Promise.resolve();
      self.getActions().add(count);
    },
  }))
  .middleware((store) => {
    expectType<StateCreator<ModuleState, SetState<ModuleState>>>(store);
    return store;
  })
  .build();

// state only
expectType<ModuleState>(module.useState());
// actions only
expectType<ModuleActions & ModuleMethods>(module.useActions());
// state selector
expectType<number>(module.useState((state) => state.count));
// computed
expectType<ModuleComputed>(module.useComputed());
// state and action composed
expectType<[ModuleState, ModuleActions & ModuleMethods]>(module.use());
