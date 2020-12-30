import create from 'zustand'
import produce from 'immer'

const capitalize = (content) => content.charAt(0).toUpperCase() + content.slice(1)

function validateNaming(object) {
  if (Object.keys(object).some((key) => key === 'actions' || key === 'store')) {
    throw new Error('key cannot be Store or Actions')
  }
}

function defineModule() {
  let actions = {}
  let state = {}
  let views = {}

  return {
    model(_state) {
      validateNaming(_state)
      state = _state

      const module = {
        actions: (_actions) => {
          actions = _actions
          return module
        },
        views: (_views) => {
          validateNaming(_views)
          views = _views
          return module
        },
        init: (currentState = {}) => {
          const scope = {
            store: create(() => ({ ...state, ...currentState })),
            actions: {},
            stateHooks: {},
            viewHooks: {},
          }

          const immerSet = (fn) => scope.store.setState(produce(fn))
          for (const key in actions) {
            scope.actions[key] = (...args) => {
              immerSet((draft) => {
                actions[key](draft, ...args)
              })
            }
          }

          for (const key in state) {
            scope.stateHooks[`use${capitalize(key)}`] = () => scope.store((state) => state[key])
          }

          for (const key in views) {
            scope.stateHooks[`use${capitalize(key)}`] = () => scope.store(views[key])
          }

          return {
            ...scope.stateHooks,
            ...scope.viewHooks,
            useActions: () => scope.actions,
            useStore: scope.store,
          }
        },
      }
      return module
    },
  }
}

export { defineModule }
