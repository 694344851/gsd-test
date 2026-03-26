import { useEffect, useMemo, useState } from 'react';

import { ExportCasesButton } from '../components/export-cases-button';
import { DrilldownFilterSummary } from '../components/drilldown-filter-summary';
import { ProblemCaseTable } from '../components/problem-case-table';
import {
  loadManagerDrilldown,
  type ManagerDrilldownResponse,
} from '../lib/manager-drilldown-api';
import { parseDrilldownIntent } from '../lib/manager-drilldown-contracts';
import type { ViewerContext } from '../lib/viewer-context-contracts';

export interface ManagerDrilldownPageProps {
  search: string;
  onBack: () => void;
  onLoadDrilldown?: typeof loadManagerDrilldown;
  viewerContext?: ViewerContext;
}

export function ManagerDrilldownPage({
  search,
  onBack,
  onLoadDrilldown = loadManagerDrilldown,
  viewerContext,
}: ManagerDrilldownPageProps) {
  const intent = useMemo(() => parseDrilldownIntent(new URLSearchParams(search)), [search]);
  const [data, setData] = useState<ManagerDrilldownResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!intent) {
      setData(null);
      setStatus('error');
      return;
    }

    let active = true;
    setStatus('loading');

    void onLoadDrilldown(intent)
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
        setData(null);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [intent, onLoadDrilldown]);

  if (viewerContext?.viewer_role === 'doctor') {
    return (
      <main className="dashboard-page">
        <div className="module-state">
          <h2 className="module-state__heading">当前角色无权访问管理端下钻</h2>
          <p className="module-state__body">请返回医生端诊鉴页面继续当前就诊流程。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__hero dashboard-page__hero--drilldown">
        <div>
          <p className="dashboard-page__eyebrow">问题病例下钻</p>
          <h1 className="dashboard-page__title">管理端问题病例明细</h1>
          <p className="dashboard-page__subtitle">将首页聚合信号切换为病例级问题明细，支持后续导出与人工复核。</p>
        </div>
        <button className="dashboard-page__back" type="button" onClick={onBack}>
          返回首页
        </button>
      </header>

      {status === 'loading' ? (
        <div className="module-state">
          <h2 className="module-state__heading">问题病例明细加载中</h2>
          <p className="module-state__body">正在按当前 URL 范围同步病例明细。</p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="module-state">
          <h2 className="module-state__heading">下钻参数无效或数据加载失败</h2>
          <p className="module-state__body">请返回首页重新选择科室、医生或病种入口。</p>
        </div>
      ) : null}

      {status === 'success' && data ? (
        <div className="dashboard-layout">
          <DrilldownFilterSummary intent={data.request} summary={data.summary} />
          {data.rows.length === 0 ? (
            <div className="module-state">
              <h2 className="module-state__heading">当前筛选范围暂无问题病例</h2>
              <p className="module-state__body">请返回首页调整时间范围或下钻入口后重试。</p>
            </div>
          ) : (
            <section className="dashboard-panel">
              <h2 className="dashboard-panel__heading">问题病例列表</h2>
              <p className="dashboard-panel__body">病例级结果与后续导出会共用同一套筛选范围。</p>
              <ExportCasesButton request={data.request} />
              <ProblemCaseTable rows={data.rows} />
            </section>
          )}
        </div>
      ) : null}
    </main>
  );
}
