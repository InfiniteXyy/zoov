import React from 'react';
import type { ModuleContext, MiddlewareBuilder, Module, Scope } from './types';

export type ModuleProviderOption<State> = { defaultValue?: Partial<State>; middleware?: MiddlewareBuilder<State> };
type ModuleHandlerOption<M> = M extends Module<infer State> ? ModuleProviderOption<State> : never;
type ModuleHandler = (handle: <M extends Module>(module: M, options: ModuleHandlerOption<M>) => void) => void;

export const BuildScopeSymbol = Symbol('scope-build');
const scopeContext = React.createContext<ModuleContext>(new Map<Module, Scope>());

export const defineProvider = (handler: ModuleHandler) => {
  const handleScopeMap = (map: Map<Module, Scope>, getContext?: () => ModuleContext): Map<Module, Scope> => {
    const result = new Map(map);
    handler((module, options) => {
      BuildScopeSymbol in module && result.set(module, (module as any)[BuildScopeSymbol]({ ...options, getContext }));
    });
    return result;
  };

  return ({ children }: { children: React.ReactNode }) => {
    const scopeMap = React.useContext(scopeContext);
    const currentScopeMap: Map<Module, Scope> = React.useMemo(() => handleScopeMap(scopeMap, () => currentScopeMap), []);
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
