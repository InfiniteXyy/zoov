import React from 'react';
import ReactDOM from 'react-dom';
import { BasicUsage } from './basic-usage';
import { WithMiddleware } from './with-middleware';
import { WithProvider } from './with-provider';
import { WithRxJS } from './with-rxjs';
import { WithSelector } from './with-selector';
import { WithSetState } from './with-set-state';
import { WithTransientScope } from './with-transient-scope';

const App = () => {
  return (
    <>
      <BasicUsage />
      <WithMiddleware />
      <WithProvider />
      <WithRxJS />
      <WithSelector />
      <WithSetState />
      <WithTransientScope />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
