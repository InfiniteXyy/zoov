import type { Draft } from 'immer';
import type { StateCreator } from 'zustand';
import { expectType } from 'tsd';
import { defineModule } from '../src';
import { useTrackedModule } from '../src/tracked';

import { ActionsRecord, __buildScopeSymbol } from '../src/types';

type ModuleState = { count: number };
type ModuleComputed = { doubled: number };
type ModuleActions = ActionsRecord<ModuleState> & { add: (count?: number) => void };
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
    expectType<StateCreator<ModuleState, any, any, any>>(store);
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
expectType<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>(module.use());
expectType<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>(useTrackedModule(module));