import { renderHook, act } from '@testing-library/react-hooks';
import { defineModule } from '../src';

describe('test module factory', function () {
  it('factory chain is immutable', function () {
    const factory1 = defineModule({ state: 0 });
    const factory2 = factory1.actions({});

    const factory3 = factory2.methods(() => ({
      hello: () => {},
    }));

    const Module2 = factory2.build();
    const Module3 = factory3.build();

    act(() => {
      const { result: result2 } = renderHook(() => Module2.useActions());
      const { result: result3 } = renderHook(() => Module3.useActions());
      expect(Object.keys(result2.current)).toHaveLength(1); // setState
      expect(Object.keys(result3.current)).toHaveLength(2); // setState + hello
    });
  });
});
