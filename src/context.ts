import React from 'react';
import { ScopeContext, Module, Scope, ScopeBuildOption } from './types';

type HandlerOption<M> = M extends Module<infer State> ? ScopeBuildOption<State> : never;
type Handler = (handle: <M extends Module>(module: M, options: HandlerOption<M>) => void) => void;

export const BuildScopeSymbol = Symbol('build-scope');
const scopeContext = React.createContext<ScopeContext>(new Map<Module, Scope>());

type ScopeBuilder = { [BuildScopeSymbol]: (options: ScopeBuildOption<any>) => Scope };

export const defineProvider = (handler: Handler) => {
  const providerScopeMap = new Map<Module, Scope>();
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

export const useScopeOr = <T extends Scope>(module: Module, globalScope: T): T => {
  const scopeMap = useScopeContext();
  return (scopeMap.get(module) as T) || globalScope;
};
