import { createContext, createElement, useMemo, useContext, ReactNode } from 'react';
import type { ScopeContext, HooksModule, ScopeBuildOption, ScopeRef } from './types';

type HandlerOption<M> = M extends HooksModule<infer State> ? ScopeBuildOption<State> : never;
type Handler = (handle: <M extends HooksModule<any>>(module: M, options: HandlerOption<M>) => void) => void;

const globalScope = new Map<HooksModule, ScopeRef>();

const scopeContext = createContext<ScopeContext>(globalScope);

export const defineProvider = (handler: Handler) => {
  const overrideScopeMap = new Map<HooksModule, ScopeRef>();
  handler((module, options) => {
    overrideScopeMap.set(module, { buildOption: options });
  });
  return ({ children }: { children: ReactNode }) => {
    const scopeMap = useContext(scopeContext);
    const currentScopeMap = useMemo(() => new Map([...scopeMap, ...overrideScopeMap]), []);
    return createElement(scopeContext.Provider, { value: currentScopeMap }, children);
  };
};

export const useScopeContext = () => {
  return useContext(scopeContext);
};
