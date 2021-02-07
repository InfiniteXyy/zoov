import React from 'react';
import ReactDOM from 'react-dom';
import { BasicUsage } from './basic-usage';
import { WithMiddleware } from './with-middleware';

const App = () => {
  return (
    <>
      <BasicUsage />
      <WithMiddleware />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
