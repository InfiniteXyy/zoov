import React from 'react';
import ReactDOM from 'react-dom';
import { TodoList } from './todo';

const App = () => {
  return <TodoList />;
};

ReactDOM.render(<App />, document.getElementById('root'));
