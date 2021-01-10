const module = defineModule()
  .model({
    count: 0,
  })
  .init({ for: 'svelte' });

// default is react, can set globally

// for: "react" | "svelte" | "vanilla" | "vue"

// for react / vue: generate hooks

// for vanilla: generate getState, getActions, subscribe

// for svelte: generate subscribable state, and getActions
