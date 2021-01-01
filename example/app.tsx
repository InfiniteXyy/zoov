import React from 'react';
import ReactDOM from 'react-dom';
import { Counter } from './counter';
import { TodoList } from './todo';

const App = () => {
  return (
    <div>
      <TodoList />
      <Counter />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
