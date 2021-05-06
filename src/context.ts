import React from 'react';
import type { ScopeContext, HooksModule, ScopeBuildOption, ScopeRef } from './types';

type HandlerOption<M> = M extends HooksModule<infer State> ? ScopeBuildOption<State> : never;
type Handler = (handle: <M extends HooksModule<any>>(module: M, options: HandlerOption<M>) => void) => void;

const globalScope = new Map<HooksModule, ScopeRef>();

const scopeContext = React.createContext<ScopeContext>(globalScope);

export const defineProvider = (handler: Handler) => {
  const overrideScopeMap = new Map<HooksModule, ScopeRef>();
  handler((module, options) => {
    overrideScopeMap.set(module, { buildOption: options });
  });
  return ({ children }: { children: React.ReactNode }) => {
    const scopeMap = React.useContext(scopeContext);
    const currentScopeMap = React.useMemo(() => new Map([...scopeMap, ...overrideScopeMap]), []);
    return React.createElement(scopeContext.Provider, { value: currentScopeMap }, children);
  };
};

export const useScopeContext = () => {
  return React.useContext(scopeContext);
};
