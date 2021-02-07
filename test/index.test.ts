import { defineModule } from '../src';

describe('test defineModule', function () {
  it('should defineModule return only one method', function () {
    expect(Object.keys(defineModule())).toStrictEqual(['model']);
    const factory = defineModule().model({ state: 0 });
    expect(Object.keys(factory)).toStrictEqual(['actions', 'views', 'methods', 'init']);
  });

  it('should factory chain immutable', function () {
    const factory = defineModule().model({ state: 0 });
    const factory1 = factory.views({});
    const factory2 = factory.actions({});
    expect(Object.keys(factory1)).toStrictEqual(['actions', 'methods', 'init']);
    expect(Object.keys(factory2)).toStrictEqual(['views', 'methods', 'init']);
    const factory3 = factory2.methods(() => ({ hello: () => {} }));
    const instance2 = factory2.init();
    const instance3 = factory3.init();
    expect(Object.keys(instance2.useActions())).toHaveLength(0);
    expect(Object.keys(instance3.useActions())).toHaveLength(1);
  });
});
