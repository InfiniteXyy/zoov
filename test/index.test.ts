import { defineModule } from '../src';

describe('test defineModule', function () {
  it('should factory chain immutable', function () {
    const factory = defineModule({ state: 0 });
    const factory1 = factory.computed({});
    const factory2 = factory.actions({});
    expect(Object.keys(factory1)).toHaveLength(4);
    expect(Object.keys(factory2)).toHaveLength(4);
    const factory3 = factory2.methods(() => ({
      hello: () => {},
    }));
    const instance2 = factory2.build();
    const instance3 = factory3.build();
    expect(Object.keys(instance2.useActions())).toHaveLength(0);
    expect(Object.keys(instance3.useActions())).toHaveLength(1);
  });
});
