import { act, renderHook } from '@testing-library/react-hooks';
import { defineModule, effect } from '../src';
import { map, throttleTime } from 'rxjs/operators';
import { MiddlewareBuilder } from '../src/types';

type State = { count: number; input: string };

describe('test hooks', function () {
  const emptyModule = defineModule<State>({ count: 0, input: '' });

  it('should simple action works', function () {
    const Module = emptyModule.actions({ add: (draft) => (draft.count += 1) }).build();
    const { result } = renderHook(() => {
      const [{ count }, { add }] = Module.use();
      return { count, add };
    });
    expect(result.current.count).toBe(0);
    act(() => {
      result.current.add();
    });
    expect(result.current.count).toBe(1);
  });

  it('should multiple params action works', function () {
    const Module = emptyModule.actions({ add: (draft, value1: number, value2: number) => (draft.count += value1 + value2) }).build();
    const { result } = renderHook(() => {
      const [{ count }, { add }] = Module.use();
      return { count, add };
    });
    expect(result.current.count).toBe(0);
    act(() => {
      result.current.add(2, 3);
    });
    expect(result.current.count).toBe(5);
  });

  it('should selector works', function () {
    const Module = emptyModule
      .actions({
        add: (draft) => (draft.count += 1),
        setInput: (draft, input: string) => (draft.input = input),
      })
      .build();
    const spy = jest.fn();
    const { result } = renderHook(() => {
      const [input, { add }] = Module.use((state) => state.input);
      spy(input);
      return { input, add };
    });
    act(() => void result.current.add());
    expect(spy).toBeCalledTimes(1);
  });

  it('should computed works', function () {
    const spy = jest.fn();
    const Module = emptyModule
      .actions({
        add: (draft, value: number) => (draft.count += value),
      })
      .computed({
        doubled: (state) => state.count * 2,
        tripled: (state) => state.count * 3,
        prefixed: (state) => {
          spy();
          return 'p: ' + state.input;
        },
      })
      .build();
    const { result } = renderHook(() => {
      const { doubled, tripled } = Module.useComputed();
      const { add } = Module.useActions();
      const { count } = Module.useState();
      return { count, doubled, tripled, add };
    });
    expect(result.current.count).toBe(0);
    act(() => void result.current.add(2));
    expect(result.current.count).toBe(2);
    expect(result.current.doubled).toBe(4);
    expect(result.current.tripled).toBe(6);
    // computed are lazy loaded when call
    expect(spy).toBeCalledTimes(0);
  });

  it('should computed work without state', function () {
    const Module = emptyModule
      .actions({
        add: (draft, value: number) => (draft.count += value),
      })
      .computed({
        doubled: (state) => state.count * 2,
      })
      .build();
    const { result } = renderHook(() => {
      const { doubled } = Module.useComputed();
      const { add } = Module.useActions();
      return { doubled, add };
    });
    act(() => void result.current.add(2));
    expect(result.current.doubled).toBe(4);
  });

  it('should methods work', async function () {
    const Module = defineModule({ count: 2 })
      .actions({
        add: (draft, value: number) => (draft.count += value),
        reset: (draft) => (draft.count = 2),
      })
      .methods(({ getActions, getState }) => ({
        multBy: (times: number) => {
          getActions().add(getState().count * (times - 1));
        },
      }))
      .methods(({ getActions }) => ({
        lazyMultBy: async (times: number, timeout: number) => {
          await new Promise((resolve) => setTimeout(resolve, timeout));
          getActions().multBy(times);
        },
        effectMultBy: effect<number>((payload$) =>
          payload$.pipe(
            throttleTime(30),
            map((times) => getActions().multBy(times))
          )
        ),
      }))
      .build();

    const { result } = renderHook(() => {
      const [{ count }, actions] = Module.use();
      return { count, ...actions };
    });
    act(() => void result.current.multBy(3));
    expect(result.current.count).toBe(6);
    await act(async () => {
      result.current.reset();
      await result.current.lazyMultBy(3, 10);
    });
    expect(result.current.count).toBe(6);
    await act(async () => {
      result.current.reset();
      result.current.effectMultBy(3);
      await new Promise((resolve) => setTimeout(resolve, 10));
      result.current.effectMultBy(3);
    });
    expect(result.current.count).toBe(6);
  });

  it('should middleware works', function () {
    const spy = jest.fn();

    const middleware: MiddlewareBuilder<State> = (config) => (set, get, api) =>
      config(
        (args) => {
          spy(args);
          set(args);
        },
        get,
        api
      );

    const Module = emptyModule
      .actions({
        add: (draft, value: number) => (draft.count += value),
      })
      .middleware((store) => middleware(store))
      .build();
    const { result } = renderHook(() => {
      const [{ count }, { add }] = Module.use();
      return { count, add };
    });
    act(() => {
      result.current.add(2);
    });
    act(() => {
      result.current.add(2);
    });
    expect(result.current.count).toBe(4);
    expect(spy).toBeCalledTimes(2);
  });

});
