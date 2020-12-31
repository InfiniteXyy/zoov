import create from 'zustand';
import produce from 'immer';
import { Subject } from 'rxjs';

const capitalize = (content) => content.charAt(0).toUpperCase() + content.slice(1);

function validateNaming(object) {
  if (Object.keys(object).some((key) => key === 'actions' || key === 'store')) {
    throw new Error('key cannot be Store or Actions');
  }
}

function effect(builder) {
  const subject = new Subject();
  builder(subject).subscribe();
  return (payload) => {
    subject.next(payload);
  };
}

export function defineModule() {
  let actions = {};
  let state = {};
  let views = {};
  let methodsBuilders = [];

  return {
    model(_state) {
      validateNaming(_state);
      state = _state;
      const module = {
        actions: (_actions) => {
          actions = _actions;
          return module;
        },
        views: (_views) => {
          validateNaming(_views);
          views = _views;
          return module;
        },
        methods: (builder) => {
          methodsBuilders.push(builder);
          return module;
        },
        init: (currentState = {}) => {
          const scope = {
            store: create(() => ({ ...state, ...currentState })),
            actions: {},
            stateHooks: {},
            viewHooks: {},
          };

          const self = {
            getActions: () => scope.actions,
            getState: () => scope.store.getState(),
          };

          // build methods and bind this
          methodsBuilders.forEach((builder) => {
            const methods = builder(self, effect);
            for (const key in methods) {
              methods[key] = methods[key].bind(methods);
            }
            scope.actions = { ...scope.actions, ...methods };
          });

          // build actions with immer
          for (const key in actions) {
            scope.actions[key] = (...args) => {
              scope.store.setState(
                produce((draft) => {
                  actions[key](draft, ...args);
                })
              );
            };
          }
          // build state hooks
          for (const key in state) {
            scope.stateHooks[`use${capitalize(key)}`] = () => scope.store((state) => state[key]);
          }
          // build view hooks
          for (const key in views) {
            scope.stateHooks[`use${capitalize(key)}`] = () => scope.store(views[key]);
          }
          return {
            ...scope.stateHooks,
            ...scope.viewHooks,
            useActions: () => scope.actions,
            useState: scope.store,
          };
        },
      };
      return module;
    },
  };
}
