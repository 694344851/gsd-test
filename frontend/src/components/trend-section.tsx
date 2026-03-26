import { useEffect, useState } from 'react';

import type { DashboardFilters } from '../lib/analytics-filters';
import { buildTrendChartOption } from '../lib/chart-options';
import { loadTrend } from '../lib/trend-api';
import type { TrendSeriesPayload } from '../lib/trend-contracts';
import { DiagnosisTrendChart } from './diagnosis-trend-chart';

export interface TrendSectionProps {
  filters: DashboardFilters;
}

export function TrendSection({ filters }: TrendSectionProps) {
  const [rows, setRows] = useState<TrendSeriesPayload[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    void loadTrend(filters)
      .then((response) => {
        if (!active) {
          return;
        }
        setRows(response.series);
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
        <h2 className="dashboard-panel__heading">诊断质量趋势</h2>
        <div className="module-state">
          <h3 className="module-state__heading">首页数据加载失败，请刷新页面或稍后重试。</h3>
        </div>
      </section>
    );
  }

  if (status === 'loading') {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">诊断质量趋势</h2>
        <div className="module-state">
          <h3 className="module-state__heading">首页趋势加载中</h3>
          <p className="module-state__body">正在同步当前时间范围的趋势序列。</p>
        </div>
      </section>
    );
  }

  const isEmpty = rows.length === 0 || rows.every((row) => row.outpatient_count === 0);

  if (isEmpty) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">诊断质量趋势</h2>
        <div className="module-state">
          <h3 className="module-state__heading">当前时间范围暂无诊鉴数据</h3>
          <p className="module-state__body">请更换时间范围后重试。</p>
        </div>
      </section>
    );
  }

  const option = buildTrendChartOption(rows);

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel__heading">诊断质量趋势</h2>
      <DiagnosisTrendChart option={option} />
    </section>
  );
}
