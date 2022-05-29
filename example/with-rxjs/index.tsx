import React, { FC, memo, useCallback, useEffect } from 'react';
import { defineModule } from '../../src';
import { effect } from '../../src/effect';
import { exhaustMap, tap } from 'rxjs/operators';
import { timer } from 'rxjs';

const counterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
  })
  .methods(({ getActions }) => ({
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
  const [{ count }, { addAfter }] = counterModule.use();

  const addOne = useCallback(() => {
    addAfter(300);
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
