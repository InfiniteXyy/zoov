//* An adapter for react-tracked  */
import { createTrackedSelector } from 'react-tracked';
import { ActionsRecord, ComputedRecord, HooksModule, StateRecord } from './types';

const trackedSelectorMap = new WeakMap<HooksModule<any, any>, () => StateRecord>();

export const useTrackedModule = <State extends StateRecord, Actions extends ActionsRecord<State>, Computed extends ComputedRecord>(
  module: HooksModule<State, Actions, Computed>,
): [State, Actions, Computed] => {
  const trackedSelectorFn = trackedSelectorMap.get(module) || trackedSelectorMap.set(module, createTrackedSelector(module.useState)).get(module)!;
  return [trackedSelectorFn() as State, module.useActions(), module.useComputed()];
};
