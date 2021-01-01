import create from 'zustand';
import { redux, devtools } from 'zustand/middleware';
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

export function defineModule(moduleName) {
  let actions = {};
  let state = {};
  let views = {};
  let methodsBuilders = [];

  const reducer = (state, { type, payload }) => actions[type](...payload)(state);

  return {
    model(_state) {
      validateNaming(_state);
      state = _state;
      const module = {
        actions: (_actions) => {
          Object.keys(_actions).forEach((key) => {
            actions[key] = (...args) =>
              produce((draft) => {
                _actions[key](draft, ...args);
              });
          });
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
            store: create(devtools(redux(reducer, { ...state, ...currentState }), moduleName)),
            actions: {},
            stateHooks: {},
            viewHooks: {},
          };

          const self = {
            getActions: () => scope.actions,
            getState: () => scope.store.getState(),
          };

          // build methods
          const dispatch = scope.store.getState().dispatch;
          for (const key in actions) {
            scope.actions[key] = (...args) => dispatch({ type: key, payload: args });
          }
          methodsBuilders.forEach((builder) => {
            scope.actions = { ...scope.actions, ...builder(self, effect) };
          });

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
