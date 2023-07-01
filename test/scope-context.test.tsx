import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { act, cleanup, render, fireEvent, renderHook } from '@testing-library/react';
import { defineModule, defineProvider, useScopeContext } from '../src';
import { useCallback } from 'react';

type State = { count: number };

describe('test scope context', () => {
  const logSpy = vi.fn();

  beforeEach(() => {
    logSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
    module.getActions().setCount(0);
  });

  const logModule = defineModule({ prefix: 'global' })
    .methods(({ getState }) => ({
      log: (content: string) => {
        logSpy(getState().prefix + content);
      },
    }))
    .build();

  const module = defineModule<State>({ count: 0 })
    .computed({
      doubled: (state) => state.count * 2,
    })
    .actions({
      setCount: (draft, value) => (draft.count = value),
    })
    .methods(({ getActions, getState }) => ({
      add() {
        getActions().setCount(getState().count + 1);
        getActions(logModule).log('');
      },
    }))
    .build();

  const Counter = ({ testId }: { testId: string }) => {
    const [{ count }, { add }] = module.use();
    return (
      <button data-testid={testId} onClick={add}>
        {count}
      </button>
    );
  };

  it('should provider override state success', function () {
    const Provider = defineProvider((handle) => {
      handle(module, {
        defaultValue: { count: 1 },
      });
    });

    const container = render(
      <div>
        <Counter testId={'outer'} />
        <Provider>
          <Counter testId={'inner'} />
        </Provider>
      </div>
    );

    const outer = container.getByTestId('outer');
    const inner = container.getByTestId('inner');
    expect(outer.textContent).toBe('0');
    expect(inner.textContent).toBe('1');
    act(() => {
      fireEvent.click(inner);
    });
    expect(outer.textContent).toBe('0');
    expect(inner.textContent).toBe('2');
  });

  it('should provider override middleware success', function () {
    const originalMiddleware = vi.fn().mockImplementation((i) => i);
    const handledMiddleware = vi.fn().mockImplementation((i) => i);
    const module = defineModule({}).middleware(originalMiddleware).build();
    const Provider = defineProvider((handle) => {
      handle(module, { defaultValue: {}, middleware: handledMiddleware });
    });
    const Component = () => (module.use(), (<></>));
    render(
      <Provider>
        <Component />
      </Provider>
    );
    expect(originalMiddleware).not.toBeCalled();
    expect(handledMiddleware).toBeCalled();
  });

  it('should provider merge context works', function () {
    const LogProvider = defineProvider((handle) => {
      handle(logModule, {
        defaultValue: { prefix: 'custom' },
      });
    });

    const container = render(
      <div>
        <Counter testId={'outer'} />
        <LogProvider>
          <Counter testId={'inner'} />
        </LogProvider>
      </div>
    );
    const outer = container.getByTestId('outer');
    const inner = container.getByTestId('inner');
    act(() => {
      fireEvent.click(outer);
      fireEvent.click(inner);
    });
    expect(logSpy).toHaveBeenNthCalledWith(1, 'global');
    expect(logSpy).toHaveBeenNthCalledWith(2, 'custom');
  });

  it('should static getStore and useStore works', () => {
    const Module = defineModule<State>({ count: 0 })
      .actions({ setCount: (draft, value) => (draft.count = value) })
      .build();
    expect(Module.getStore().getState().count).toBe(0);

    const Provider = defineProvider((handler) => {
      handler(Module, { defaultValue: { count: 2 } });
    });
    const { result } = renderHook(() => Module.useStore().getState(), { wrapper: Provider });
    expect(result.current.count).toBe(2);
  });

  it('should static getState/getActions/getComputed works', () => {
    const module = defineModule<State>({ count: 0 })
      .computed({
        doubled: (state) => state.count * 2,
      })
      .actions({
        setCount: (draft, value) => (draft.count = value),
      })
      .build();
    expect(module.getState().count).toEqual(0);
    expect(module.getActions().setCount).toBeTypeOf('function');
    module.getActions().setCount(2);
    expect(module.getState().count).toBe(2);
    expect(module.getComputed().doubled).toBe(4);
  });

  it('should static getState/getActions/getComputed works under a scope', () => {
    const Provider = defineProvider((handle) => {
      handle(module, {
        defaultValue: { count: 123 },
      });
    });

    const Counter = ({ testId }: { testId: string }) => {
      const scope = useScopeContext();
      const { count } = module.useState();
      const { doubled } = module.useComputed();

      const mutateCount = useCallback(() => {
        // inner be 43
        module.getActions(scope).setCount(43);
        // outer be 996
        module.getActions().setCount(996);
      }, []);

      return (
        <>
          <button data-testid={testId} onClick={mutateCount}>
            {count}
          </button>
          <div data-testid={`${testId}-doubled`}>{doubled}</div>
        </>
      );
    };

    const container = render(
      <div>
        <Counter testId={'outer'} />
        <Provider>
          <Counter testId={'inner'} />
        </Provider>
      </div>
    );

    const outer = container.getByTestId('outer');
    const outerDoubled = container.getByTestId('outer-doubled');
    const inner = container.getByTestId('inner');
    const innerDoubled = container.getByTestId('inner-doubled');
    expect(outer.textContent).toBe('0');
    expect(outerDoubled.textContent).toBe('0');
    expect(inner.textContent).toBe('123');
    expect(innerDoubled.textContent).toBe('246');
    act(() => {
      fireEvent.click(inner);
    });
    expect(outer.textContent).toBe('996');
    expect(outerDoubled.textContent).toBe('1992');
    expect(inner.textContent).toBe('43');
    expect(innerDoubled.textContent).toBe('86');
  });
});
