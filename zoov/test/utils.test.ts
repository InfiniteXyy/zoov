import { map } from 'rxjs/operators';
import { capitalize, omit, effect } from '../src/utils';

describe('test utils', function () {
  it('should capitalize correct', function () {
    expect(capitalize('count')).toBe('Count');
    expect(capitalize('Capitalized')).toBe('Capitalized');
  });

  it('should omit work', function () {
    const empty: any = {};
    expect(omit(empty, ['123'])).toEqual({});

    const origin: any = { count: 0 };
    expect(omit(origin, ['count'])).toEqual({});
    expect(origin).toEqual({ count: 0 });
  });

  it('should rxjs effect work', function () {
    const fn = jest.fn();
    const dispatch = effect<{ payload: string }>((payload$) => {
      return payload$.pipe(map(({ payload }) => fn(payload)));
    });
    expect(fn).toHaveBeenCalledTimes(0);
    dispatch({ payload: '123' });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('123');
  });
});
