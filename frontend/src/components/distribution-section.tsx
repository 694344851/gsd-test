import { useEffect, useState } from 'react';

import type { DashboardFilters } from '../lib/analytics-filters';
import { loadDepartmentDistribution } from '../lib/distribution-api';
import type { DepartmentDistributionResponse } from '../lib/distribution-contracts';
import { buildDistributionChartOption } from '../lib/distribution-chart-options';
import type { DrilldownIntent } from '../lib/manager-drilldown-contracts';
import { DepartmentDistributionChart } from './department-distribution-chart';
import { DepartmentTypeFilter } from './department-type-filter';

export interface DistributionSectionProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onDrilldown?: (intent: DrilldownIntent) => void;
}

export function DistributionSection({ filters, onFiltersChange, onDrilldown }: DistributionSectionProps) {
  const [data, setData] = useState<DepartmentDistributionResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    void loadDepartmentDistribution(filters)
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

  const primaryRow = data?.rows[0];
  const doctorDrilldown = primaryRow
    ? primaryRow.department_id === 'dept-gy'
      ? { id: 'doctor-002', label: '医生二' }
      : { id: 'doctor-001', label: '医生一' }
    : null;

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel__heading">科室诊断质量分布</h2>
      {status === 'success' && data ? (
        <>
          <DepartmentTypeFilter
            options={data.available_department_types}
            value={filters.departmentTypeIds?.[0]}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                departmentTypeIds: value ? [value] : undefined,
              })
            }
          />
          {data.rows.length === 0 ? (
            <div className="module-state">
              <h3 className="module-state__heading">当前时间范围暂无诊鉴数据</h3>
              <p className="module-state__body">请更换时间范围后重试。</p>
            </div>
          ) : (
            <>
              {onDrilldown ? (
                <div className="drilldown-entry-group">
                  <button
                    className="drilldown-entry-button"
                    type="button"
                    onClick={() =>
                      primaryRow &&
                      onDrilldown({
                        dimension: 'department',
                        dimension_value: primaryRow.department_id,
                        dimension_label: primaryRow.department_name,
                        source_module: 'distribution',
                        filters,
                      })
                    }
                  >
                    查看科室问题病例
                  </button>
                  <button
                    className="drilldown-entry-button"
                    type="button"
                    onClick={() =>
                      primaryRow &&
                      doctorDrilldown &&
                      onDrilldown({
                        dimension: 'doctor',
                        dimension_value: doctorDrilldown.id,
                        dimension_label: doctorDrilldown.label,
                        source_module: 'distribution',
                        filters,
                      })
                    }
                  >
                    查看重点医生问题病例
                  </button>
                </div>
              ) : null}
              <DepartmentDistributionChart option={buildDistributionChartOption(data.rows)} />
            </>
          )}
        </>
      ) : null}
      {status === 'loading' ? (
        <div className="module-state">
          <h3 className="module-state__heading">科室分布加载中</h3>
          <p className="module-state__body">正在同步当前时间范围的科室分布数据。</p>
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="module-state">
          <h3 className="module-state__heading">首页数据加载失败，请刷新页面或稍后重试。</h3>
        </div>
      ) : null}
    </section>
  );
}
