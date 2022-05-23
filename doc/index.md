# Zoov Doc

## Keyword

- Module: a wrapper of any state object, with a bunch of actions, methods, computed values. Or you can add middlewares.
- RawModule: the module builder, you can call the .build() function to get a module instance
- Actions: a function to update the state directly.
- Methods: a higher order function to invoke multiple actions, in a sync or async way, even with rxjs.
- Computed: a function to get inferred value from the state.
- Scope: where the module keeps it's data in. By default, all modules are using a global scope. If you define a provider and handle a module, that module will have it's own scope under the context.