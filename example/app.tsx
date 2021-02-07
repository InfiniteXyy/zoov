import React from 'react';
import ReactDOM from 'react-dom';
import { BasicUsage } from './basic-usage';
import { WithMiddleware } from './with-middleware';
import { WithProvider } from './with-provider';

const App = () => {
  return (
    <>
      <BasicUsage />
      <WithMiddleware />
      <WithProvider />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
