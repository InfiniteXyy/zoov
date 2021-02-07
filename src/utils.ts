import { Observable, Subject } from 'rxjs';

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): { [k in Exclude<keyof T, K>]: T[k] } {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): { [k in K]: T[k] } {
  const result: any = {};
  keys.forEach((key) => (result[key] = obj[key]));
  return result;
}

export function effect<P>(builder: (payload$: Observable<P>) => Observable<unknown>): (payload: P) => void {
  const subject = new Subject<P>();
  builder(subject).subscribe();
  return (payload) => subject.next(payload);
}
