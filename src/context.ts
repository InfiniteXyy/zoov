import React from 'react';
import type { ScopeContext, HooksModule, Scope, ScopeBuildOption } from './types';

type HandlerOption<M> = M extends HooksModule<infer State> ? ScopeBuildOption<State> : never;
type Handler = (handle: <M extends HooksModule<any>>(module: M, options: HandlerOption<M>) => void) => void;

export const BuildScopeSymbol = Symbol('build-scope');
const scopeContext = React.createContext<ScopeContext>(new Map<HooksModule, Scope>());

type ScopeBuilder = { [BuildScopeSymbol]: (options: ScopeBuildOption<any>) => Scope };

export const defineProvider = (handler: Handler) => {
  const providerScopeMap = new Map<HooksModule, Scope>();
  handler((module, options) => {
    providerScopeMap.set(module, ((module as unknown) as ScopeBuilder)[BuildScopeSymbol]({ ...options }));
  });
  return ({ children }: { children: React.ReactNode }) => {
    const scopeMap = React.useContext(scopeContext);
    const currentScopeMap = React.useMemo(() => new Map([...scopeMap, ...providerScopeMap]), []);
    return React.createElement(scopeContext.Provider, { value: currentScopeMap }, children);
  };
};

export const useScopeContext = () => {
  return React.useContext(scopeContext);
};

export const useScopeOr = <T extends Scope<any, any, any>>(module: HooksModule<any, any, any>, globalScope: T): T => {
  const scopeMap = useScopeContext();
  return (scopeMap.get(module) as T) || globalScope;
};
