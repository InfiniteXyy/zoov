import React, { Key } from 'react';
import ReactDOM from 'react-dom';

type State = {
  count: number;
  deep: {
    checked: boolean;
    name: string;
  };
};

type StateSetter<T> = ((originalValue: T) => T) | T;

type SetState<State> = {
  <Key1 extends keyof State, Setter extends StateSetter<State[Key1]>>(key: Key1, value: Setter): void;
  // <Key1 extends keyof State, Key2 extends keyof NonNullable<State[Key1]>, Setter extends StateSetter<NonNullable<State[Key1]>[Key2]>>(key1: Key1, key2, Key2, value: Setter): void;
};

const setState: SetState<State> = () => {};
function App() {
  setState('count', () => 2);
  // setState('deep', "name", );
  return <div>123</div>;
}

ReactDOM.render(<App />, document.getElementById('root'));
