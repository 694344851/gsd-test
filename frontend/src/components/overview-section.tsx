import { useEffect, useState } from 'react';

import type { DashboardFilters } from '../lib/analytics-filters';
import { loadOverview } from '../lib/overview-api';
import type { OverviewResponse } from '../lib/overview-contracts';
import { OverviewCardGrid } from './overview-card-grid';

export interface OverviewSectionProps {
  filters: DashboardFilters;
}

export function OverviewSection({ filters }: OverviewSectionProps) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    void loadOverview(filters)
      .then((response) => {
        if (!active) {
          return;
        }
        setData(response);
        setStatus('success');
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [filters]);

  if (status === 'error') {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">概览指标</h2>
        <div className="module-state">
          <h3 className="module-state__heading">首页数据加载失败，请刷新页面或稍后重试。</h3>
        </div>
      </section>
    );
  }

  if (status === 'loading' || data === null) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">概览指标</h2>
        <div className="module-state">
          <h3 className="module-state__heading">首页概览加载中</h3>
          <p className="module-state__body">正在同步当前时间范围的首页摘要。</p>
        </div>
      </section>
    );
  }

  const isEmpty =
    data.summary.outpatient_count === 0 &&
    data.summary.success_evaluated_count === 0;

  if (isEmpty) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">概览指标</h2>
        <div className="module-state">
          <h3 className="module-state__heading">当前时间范围暂无诊鉴数据</h3>
          <p className="module-state__body">请更换时间范围后重试。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel__heading">概览指标</h2>
      <OverviewCardGrid summary={data.summary} previousSummary={data.previous_summary} />
    </section>
  );
}
