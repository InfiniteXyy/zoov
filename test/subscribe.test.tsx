import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { generateSubscribeBuilder } from '../src/subscribe';
import { defineModule } from '../src/index';

describe('test subscribe', () => {
  it('should selector works, and should fireImmediately by default', async () => {
    const mockCallback = vi.fn();
    const listener = generateSubscribeBuilder({ selector: (s) => s.a, listener: mockCallback })({ a: 1, b: 2 });
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(1, 1, expect.anything());
    });
    listener({ a: 1, b: 3 });
    expect(mockCallback).toHaveBeenCalledTimes(1);
    listener({ a: 2, b: 3 });
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback.mock.lastCall).toEqual([2, 1, expect.anything()]);
  });

  it('should support function parameter', async () => {
    const mockCallback = vi.fn();
    generateSubscribeBuilder(mockCallback)({ a: 1 });
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith({ a: 1 }, { a: 1 }, expect.anything());
    });
  });

  it('should fireImmediately can be turned off', async () => {
    const mockCallback = vi.fn();
    generateSubscribeBuilder({ listener: mockCallback, fireImmediately: false })({ a: 1 });
    await waitFor(() => {
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  it('should custom equalFn works', () => {
    const mockCallback = vi.fn();
    const listener = generateSubscribeBuilder({ listener: mockCallback, equalityFn: () => false, fireImmediately: false })({ a: 1 });
    listener({ a: 1 });
    expect(mockCallback).toHaveBeenCalledTimes(1);
    listener({ a: 1 });
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  it('should cleanup be called before next change', () => {
    const mockCleanup = vi.fn();
    const listener = generateSubscribeBuilder({
      listener: (current, prev, { addCleanup }) => addCleanup(mockCleanup),
      fireImmediately: false,
    })({ a: 1 });
    listener({ a: 2 });
    expect(mockCleanup).toHaveBeenCalledTimes(0);
    listener({ a: 3 });
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });

  it('should subscribe calls, when module is first used in components', async () => {
    const mockCallback = vi.fn();

    const Module = defineModule({ a: 1 })
      .subscribe({ selector: (s) => s.a, listener: mockCallback })
      .build();

    await waitFor(() => {
      expect(mockCallback).not.toHaveBeenCalled();
    });

    renderHook(() => Module.use());

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(1, 1, expect.anything());
    });
  });
});
