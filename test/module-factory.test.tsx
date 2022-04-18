import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { defineModule } from '../src';

describe('test module factory', function () {
  afterEach(cleanup);

  it('factory chain is immutable', function () {
    const factory1 = defineModule({ state: 0 });
    const factory2 = factory1.actions({});

    const factory3 = factory2.methods(() => ({
      hello: () => {},
    }));

    const Module2 = factory2.build();
    const Module3 = factory3.build();
    {
      const { result } = renderHook(() => Module2.useActions());
      expect(Object.keys(result.current)).toHaveLength(1); // setState
    }
    {
      const { result } = renderHook(() => Module3.useActions());
      expect(Object.keys(result.current)).toHaveLength(2); // setState + hello
    }
  });
});
