import type { Draft } from 'immer';
import { Observable } from 'rxjs';
import { expect, expectTypeOf, it } from 'vitest';
import type { StateCreator } from 'zustand';
import { defineModule, InferModule, useModule, useModuleActions, useModuleComputed } from '../src';
import { effect } from '../src/effect';
import { useTrackedModule } from '../src/tracked';
import { ActionsRecord, SetState } from '../src/types';
import { renderHook } from '@testing-library/react';

// expectations
type ModuleState = { count: number };
type ModuleComputed = { doubled: number };
type ModuleActions = ActionsRecord<ModuleState> & { add: (count?: number) => void };
type ModuleMethods = { addAsync(count?: number): Promise<void> } & { methodWithThis(payload: string): void };

const getModule = () =>
  defineModule<ModuleState>({ count: 0 })
    .actions({
      add: (state, count?: number) => {
        expectTypeOf(state).toEqualTypeOf<Draft<ModuleState>>();
        state.count += count || 1;
      },
    })
    .computed({
      doubled: (state) => {
        expectTypeOf(state).toEqualTypeOf<ModuleState>();
        return state.count * 2;
      },
    })
    .methods((self) => ({
      async addAsync(count?: number) {
        expectTypeOf(self.getActions()).toEqualTypeOf<ModuleActions>();
        expectTypeOf(self.getState()).toEqualTypeOf<ModuleState>();
        expectTypeOf(self.getComputed()).toEqualTypeOf<ModuleComputed>();
        await Promise.resolve();
        self.getActions().add(count);
      },
    }))
    .methods({
      methodWithThis(_payload: string) {
        expectTypeOf(this.getActions()).toEqualTypeOf<ModuleActions & Omit<ModuleMethods, 'methodWithThis'>>();
        expectTypeOf(this.getState()).toEqualTypeOf<ModuleState>();
        expectTypeOf(this.getComputed()).toEqualTypeOf<ModuleComputed>();
      },
    })
    .middleware((store) => {
      expectTypeOf(store).toEqualTypeOf<StateCreator<ModuleState, any, any, any>>();
      return store;
    })
    // subscription
    .subscribe((state) => {
      expectTypeOf(state).toEqualTypeOf<ModuleState>();
    })
    .subscribe({
      listener: (state) => {
        expectTypeOf(state).toEqualTypeOf<ModuleState>();
      },
      equalityFn: (state, newState) => {
        expectTypeOf(state).toEqualTypeOf<ModuleState>();
        expectTypeOf(newState).toEqualTypeOf<ModuleState>();
        return false;
      },
    })
    .subscribe({
      selector: (state) => {
        expectTypeOf(state).toEqualTypeOf<ModuleState>();
        return state.count;
      },
      listener: async (state, prevState, { addCleanup }) => {
        expectTypeOf(state).toEqualTypeOf<number>();
        expectTypeOf(prevState).toEqualTypeOf<number>();
        expectTypeOf(addCleanup(() => {})).toEqualTypeOf<void>();
      },
    })
    .build();

it('test basic selector hooks', () => {
  const module = getModule();
  renderHook(() => {
    // state only
    expectTypeOf(module.useState()).toEqualTypeOf<ModuleState>();
    // actions only
    expectTypeOf(module.useActions()).toEqualTypeOf<ModuleActions & ModuleMethods>();
    expectTypeOf(useModuleActions(module)).toEqualTypeOf<ModuleActions & ModuleMethods>();
    // state selector
    expectTypeOf(
      module.useState(
        (state) => ({ doubled: state.count * 2 }),
        (a, b) => {
          expectTypeOf(a).toEqualTypeOf<{ doubled: number }>();
          expectTypeOf(b).toEqualTypeOf<{ doubled: number }>();
          return a === b;
        },
      ),
    ).toEqualTypeOf<{ doubled: number }>();

    expectTypeOf(
      useModule(
        module,
        (state) => ({ doubled: state.count * 2 }),
        (a, b) => {
          expectTypeOf(a).toEqualTypeOf<{ doubled: number }>();
          expectTypeOf(b).toEqualTypeOf<{ doubled: number }>();
          return a === b;
        },
      )[0],
    ).toEqualTypeOf<{ doubled: number }>();

    // computed
    expectTypeOf(module.useComputed()).toEqualTypeOf<ModuleComputed>();
    expectTypeOf(useModuleComputed(module)).toEqualTypeOf<ModuleComputed>();

    // state and action composed
    expectTypeOf(module.use()).toEqualTypeOf<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>();
    expectTypeOf(useTrackedModule(module)).toEqualTypeOf<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>();
    expectTypeOf(useModule(module)).toEqualTypeOf<[ModuleState, ModuleActions & ModuleMethods, ModuleComputed]>();
  });
});

it('test internal actions', () => {
  const module = getModule();
  renderHook(() => {
    // @ts-expect-error
    expect(() => module.useActions().setState()).toThrowError();
    module.useActions().$setState('count', 2);

    expectTypeOf(module.useActions().$setState).toEqualTypeOf<SetState<ModuleState>>();
    expectTypeOf(module.useActions().$reset).toEqualTypeOf<() => void>();
  });
});

it('test rxjs effect', () => {
  const fn = effect((payload) => {
    expectTypeOf(payload).toEqualTypeOf<Observable<void>>();
    return payload.pipe();
  });
  expectTypeOf(fn).toEqualTypeOf<(payload: void) => void>(fn);
});

it('test inference type utility', () => {
  expectTypeOf({} as InferModule<ReturnType<typeof getModule>>['state']).toEqualTypeOf<ModuleState>();
  expectTypeOf({} as InferModule<ReturnType<typeof getModule>>['actions']).toEqualTypeOf<ModuleActions & ModuleMethods>();
  expectTypeOf({} as InferModule<ReturnType<typeof getModule>>['computed']).toEqualTypeOf<ModuleComputed>();
});
