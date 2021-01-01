import React, { useState } from 'react';
import { EMPTY, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { defineModule } from 'zoov';

const CounterModule = defineModule()
  .model({ count: 0 })
  .actions({
    increase: (draft, value) => (draft.count += value),
    decrease: (draft, value) => (draft.count -= value),
    reset: (draft) => (draft.count = 0),
  })
  .methods((self, effect) => ({
    // 有时，只是 Async 函数可能无法满足需求
    // methods 的第二个参数 effect，允许用 RxJS 封装一个流
    setTimer: effect<{ interval?: number }>((payload$) => {
      return payload$.pipe(
        switchMap(({ interval }) => {
          self.getActions().reset();
          if (!interval) return EMPTY;
          return timer(interval, interval).pipe(
            tap(() => self.getActions().increase(1)),
            tap(() => {
              console.log(self.getState().count);
            })
          );
        })
      );
    }),
  }));

const counterModule = CounterModule.init({ name: 'counterModule', persist: 'counter' });

export const Counter = () => {
  const count = counterModule.useCount();
  const { setTimer } = counterModule.useActions();

  const [gap, setGap] = useState(1000);

  return (
    <div>
      <h1>Timer App</h1>
      <label>
        interval time:
        <input type="number" value={gap} onChange={(e) => setGap(Number(e.target.value))} />
      </label>
      <h3>{count}</h3>
      <button onClick={() => setTimer({ interval: gap })}>start timer</button>
      <button onClick={() => setTimer({})}>stop timer</button>
    </div>
  );
};
