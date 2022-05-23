import React from 'react';
import { createRoot } from 'react-dom/client';
import { BasicUsage } from './basic-usage';
import { WithComputed } from './with-computed';
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
      <WithComputed />
      <WithMiddleware />
      <WithProvider />
      <WithRxJS />
      <WithSelector />
      <WithSetState />
      <WithTransientScope />
    </>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
