import { useEffect, useState } from 'react';

import type { DashboardFilters } from '../lib/analytics-filters';
import { loadDiseaseInsights } from '../lib/disease-insights-api';
import type { DiseaseInsightsResponse } from '../lib/disease-insights-contracts';
import { buildDiseaseCloudLayout } from '../lib/disease-cloud-layout';
import type { DrilldownIntent } from '../lib/manager-drilldown-contracts';

export interface DiseaseInsightsSectionProps {
  filters: DashboardFilters;
  onDrilldown?: (intent: DrilldownIntent) => void;
}

export function DiseaseInsightsSection({ filters, onDrilldown }: DiseaseInsightsSectionProps) {
  const [data, setData] = useState<DiseaseInsightsResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    void loadDiseaseInsights(filters)
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
        <h2 className="dashboard-panel__heading">高发问题病种</h2>
        <div className="module-state">
          <h3 className="module-state__heading">首页数据加载失败，请刷新页面或稍后重试。</h3>
        </div>
      </section>
    );
  }

  if (status === 'loading' || data === null) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">高发问题病种</h2>
        <div className="module-state">
          <h3 className="module-state__heading">病种洞察加载中</h3>
          <p className="module-state__body">正在同步当前时间范围的高发问题病种。</p>
        </div>
      </section>
    );
  }

  if (data.rows.length === 0) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel__heading">高发问题病种</h2>
        <div className="module-state">
          <h3 className="module-state__heading">当前时间范围暂无诊鉴数据</h3>
          <p className="module-state__body">请更换时间范围后重试。</p>
        </div>
      </section>
    );
  }

  const items = buildDiseaseCloudLayout(data.rows);

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel__heading">高发问题病种</h2>
      <div className="disease-cloud" data-testid="disease-cloud">
        {items.map((item) => (
          <button
            key={item.diseaseId}
            className={`disease-cloud__item is-${item.ring}`}
            style={{
              left: item.left,
              top: item.top,
              color: item.color,
              fontSize: `${item.fontSize}px`,
            }}
            type="button"
            disabled={!onDrilldown}
            onClick={() =>
              onDrilldown?.({
                dimension: 'disease',
                dimension_value: item.diseaseId,
                dimension_label: item.diseaseName,
                source_module: 'disease_insights',
                filters,
              })
            }
          >
            <div className="disease-cloud__name">{item.diseaseName}</div>
            <div className="disease-cloud__meta">
              问题数 {item.issueCount} · 严重度 {(item.severityRatio * 100).toFixed(0)}%
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
