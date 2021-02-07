import React, { FC, memo, useCallback, useEffect } from 'react';
import { defineModule } from '../../src';
import { exhaustMap, tap } from 'rxjs/operators';
import { timer } from 'rxjs';

const CounterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
  })
  .methods(({ getActions }, effect) => ({
    addAfter: effect<number>((payload$) =>
      payload$.pipe(
        exhaustMap((timeout) => {
          return timer(timeout).pipe(tap(() => getActions().add()));
        })
      )
    ),
  }))
  .build();

export const WithRxJS: FC = memo(() => {
  const { count } = CounterModule.useState();
  const { addAfter } = CounterModule.useActions();

  const addOne = useCallback(() => {
    addAfter(300);
  }, []);

  useEffect(() => {
    CounterModule.getState$().subscribe((i) => console.log({ count: i.count }));
  }, []);

  return (
    <div>
      <h3>With RxJS</h3>
      <p>
        count: <b>{count}</b>
      </p>
      <button onClick={addOne}>+1 in 0.3s</button>
    </div>
  );
});
