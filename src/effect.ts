/* An adapter for rxjs  */
import { Subject } from 'rxjs';
import type { Observable } from 'rxjs';

export function effect<P = void>(builder: (payload$: Observable<P>) => Observable<unknown>): (payload: P) => void {
  const subject = new Subject<P>();
  builder(subject).subscribe();
  return (payload) => subject.next(payload);
}
