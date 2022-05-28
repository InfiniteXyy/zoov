import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineModule } from '../src';
import { useTrackedModule } from '../src/tracked';

describe('test tracked-module', function () {
  it('should react-tracked adapter work', function () {
    const spy = vi.fn();
    const module = defineModule({ count: 0, input: '' })
      .computed({ doubled: (state) => state.count * 2 })
      .build();
    const { result } = renderHook(() => {
      spy();
      const [{ count }, actions, { doubled }] = useTrackedModule(module);
      return { count, actions, doubled };
    });
    expect(spy).toBeCalledTimes(1);
    act(() => result.current.actions.setState('input', (i) => i + '1'));
    expect(spy).toBeCalledTimes(1);
    act(() => result.current.actions.setState('count', (i) => i + 1));
    expect(spy).toBeCalledTimes(2);
    expect(result.current.doubled).toBe(2);
  });
});
