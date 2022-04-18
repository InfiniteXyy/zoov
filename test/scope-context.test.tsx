import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { act, cleanup, render } from '@testing-library/react';
import { defineModule, defineProvider } from '../src';

type State = { count: number };

describe('test scope context', () => {
  const logSpy = vi.fn();

  beforeEach(() => {
    logSpy.mockReset();
  });

  afterEach(cleanup);

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
      inner.click();
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
      inner.click();
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
      outer.click();
      inner.click();
    });
    expect(logSpy).toHaveBeenNthCalledWith(1, 'global');
    expect(logSpy).toHaveBeenNthCalledWith(2, 'custom');
  });
});
