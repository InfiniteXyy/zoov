import React from 'react';
import ReactDOM from 'react-dom';
import { BasicUsage } from './basic-usage';
import { WithMiddleware } from './with-middleware';
import { WithProvider } from './with-provider';
import { WithRxJS } from './with-rxjs';

const App = () => {
  return (
    <>
      <BasicUsage />
      <WithMiddleware />
      <WithProvider />
      <WithRxJS />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
