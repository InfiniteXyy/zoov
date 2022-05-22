import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { act, cleanup, render, fireEvent } from '@testing-library/react';
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
    Module.getActions().setCount(0);
  });

  const LogModule = defineModule({ prefix: 'global' })
    .methods(({ getState }) => ({
      log: (content: string) => {
        logSpy(getState().prefix + content);
      },
    }))
    .build();

  const Module = defineModule<State>({ count: 0 })
    .actions({
      setCount: (draft, value) => (draft.count = value),
    })
    .methods(({ getActions, getState }) => ({
      add() {
        getActions().setCount(getState().count + 1);
        getActions(LogModule).log('');
      },
    }))
    .build();

  const Counter = ({ testId }: { testId: string }) => {
    const [{ count }, { add }] = Module.use();
    return (
      <button data-testid={testId} onClick={add}>
        {count}
      </button>
    );
  };

  it('should provider override state success', function () {
    const Provider = defineProvider((handle) => {
      handle(Module, {
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

  it('should provider get ', function () {
    const Provider = defineProvider((handle) => {
      handle(Module, {
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

  it('should outer provider works', function () {
    const LogProvider = defineProvider((handle) => {
      handle(LogModule, {
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

  it('should static getState/getActions works, using the global scope', () => {
    const Module = defineModule<State>({ count: 0 })
      .actions({
        setCount: (draft, value) => (draft.count = value),
      })
      .build();
    expect(Module.getState().count).toEqual(0);
    expect(Module.getActions().setCount).toBeTypeOf('function');
    Module.getActions().setCount(2);
    expect(Module.getState().count).toBe(2);
  });

  it('should static getState/getActions works under a scope', () => {
    const Provider = defineProvider((handle) => {
      handle(Module, {
        defaultValue: { count: 123 },
      });
    });

    const Counter = ({ testId }: { testId: string }) => {
      const scope = useScopeContext();
      const { count } = Module.useState();

      const mutateCount = useCallback(() => {
        // inner be 43
        Module.getActions(scope).setCount(43);
        // outer be 996
        Module.getActions().setCount(996);
      }, []);

      return (
        <button data-testid={testId} onClick={mutateCount}>
          {count}
        </button>
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
    const inner = container.getByTestId('inner');
    expect(outer.textContent).toBe('0');
    expect(inner.textContent).toBe('123');
    act(() => {
      fireEvent.click(inner);
    });
    expect(outer.textContent).toBe('996');
    expect(inner.textContent).toBe('43');
  });
});
