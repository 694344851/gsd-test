import React from 'react';
import ReactDOM from 'react-dom/client';

import { DashboardOverviewPage } from './app/dashboard-overview-page';
import './styles/dashboard.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DashboardOverviewPage />
  </React.StrictMode>,
);
