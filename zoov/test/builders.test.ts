import { extendMethods, extendViews, extendActions, initInstance } from '../src/builders';
import { Module } from '../src/types';

type State = { count: number };

describe('test builders', function () {
  const emptyModule: Module = { reducers: {}, methodsBuilders: [], computed: {} };

  it('should extendViews work', function () {
    const views = { doubled: (state: State) => state.count * 2 };
    const module = { ...emptyModule };
    const extender = extendViews(views);
    const newModule = extender(module);
    expect(newModule.computed).toStrictEqual(views);
    expect(module).toStrictEqual(emptyModule);
  });

  it('should extendMethods work', function () {
    const methodsBuilder = () => ({ hello: () => console.log('Hello') });
    const module = { ...emptyModule };
    const extender = extendMethods(methodsBuilder);
    const newModule = extender(module);
    expect(newModule.methodsBuilders[0]).toBe(methodsBuilder);
    expect(newModule.methodsBuilders).toHaveLength(1);
    expect(module).toStrictEqual(emptyModule);
  });

  it('should extendActions work', function () {
    const actions = { increase: (draft: any) => draft.count++ };
    const module = { ...emptyModule };
    const extender = extendActions(actions);
    const newModule = extender(module);
    expect(typeof newModule.reducers.increase()).toBe('function');
    expect(module).toStrictEqual(emptyModule);
  });

  it('should init instance correct', function () {
    const state: State = { count: 0 };

    const module: Module<State> = {
      methodsBuilders: [() => ({ hello: () => console.log('Hello') })],
      reducers: { increase: () => (state) => state },
      computed: { doubled: (state) => state.count * 2 },
    };
    const instance = initInstance(state, module)();
    const { hello, increase } = instance.useActions();
    expect(typeof hello).toBe('function');
    expect(typeof increase()).not.toBe('function');
    expect(Object.keys(instance)).toContain('useDoubled');
    expect(Object.keys(instance)).toContain('useCount');
  });
});
