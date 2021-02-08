import { renderHook, act } from '@testing-library/react-hooks';
import { defineModule } from '../src';

describe('test module factory', function () {
  it('factory chain is immutable', function () {
    const factory = defineModule({ state: 0 });
    const factory1 = factory.computed({});
    const factory2 = factory.actions({});

    expect(Object.keys(factory1)).toHaveLength(4);
    expect(Object.keys(factory2)).toHaveLength(4);
    const factory3 = factory2.methods(() => ({
      hello: () => {},
    }));

    const Module2 = factory2.build();
    const Module3 = factory3.build();

    act(() => {
      const { result: result2 } = renderHook(() => Module2.useActions());
      const { result: result3 } = renderHook(() => Module3.useActions());
      expect(Object.keys(result2.current)).toHaveLength(0);
      expect(Object.keys(result3.current)).toHaveLength(1);
    });
  });
});
