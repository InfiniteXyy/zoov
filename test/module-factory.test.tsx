import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { defineModule, VERSION } from '../src';
import packageJson from '../package.json';

describe('test module factory', function () {
  afterEach(cleanup);

  it('should export version be correct', function () {
    expect(VERSION).toBe(packageJson.version);
  });

  it('should factory builder methods be pure function', function () {
    const factory1 = defineModule({ state: 0 });
    const factory2 = factory1.actions({});

    const factory3 = factory2.methods(() => ({
      hello: () => {},
    }));

    const module2 = factory2.build();
    const module3 = factory3.build();
    {
      const { result } = renderHook(() => module2.useActions());
      expect(Object.keys(result.current)).toHaveLength(3); // $setState + setState + $reset
    }
    {
      const { result } = renderHook(() => module3.useActions());
      expect(Object.keys(result.current)).toHaveLength(4); // $setState + setState + $reset + hello
    }
  });
});
