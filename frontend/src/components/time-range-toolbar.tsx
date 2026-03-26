import { useEffect, useState } from 'react';

import type { DashboardFilters } from '../lib/analytics-filters';
import { getRangeLabel, timeRangeOptions } from '../lib/analytics-filters';

interface TimeRangeToolbarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function TimeRangeToolbar({ filters, onFiltersChange }: TimeRangeToolbarProps) {
  const [draftStartDate, setDraftStartDate] = useState(filters.startDate ?? '');
  const [draftEndDate, setDraftEndDate] = useState(filters.endDate ?? '');

  useEffect(() => {
    setDraftStartDate(filters.startDate ?? '');
    setDraftEndDate(filters.endDate ?? '');
  }, [filters.endDate, filters.startDate]);

  const summary =
    filters.rangeKey === 'custom' && filters.startDate && filters.endDate
      ? `统计范围 ${filters.startDate} 至 ${filters.endDate} · 截止昨日（${filters.asOfDate}）`
      : `统计范围 ${getRangeLabel(filters.rangeKey)} 至 ${filters.asOfDate} · 截止昨日（${filters.asOfDate}）`;

  return (
    <section className="dashboard-toolbar">
      <p className="dashboard-toolbar__label">时间范围</p>
      <div className="dashboard-toolbar__chips">
        {timeRangeOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`dashboard-toolbar__chip${filters.rangeKey === option.key ? ' is-active' : ''}`}
            aria-pressed={filters.rangeKey === option.key}
            onClick={() => {
              if (option.key === 'custom') {
                onFiltersChange({
                  ...filters,
                  rangeKey: 'custom',
                });
                return;
              }
              onFiltersChange({
                ...filters,
                rangeKey: option.key,
                startDate: undefined,
                endDate: undefined,
              });
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filters.rangeKey === 'custom' ? (
        <>
          <div className="dashboard-toolbar__custom">
            <div className="dashboard-toolbar__field">
              <label htmlFor="custom-start-date">开始日期</label>
              <input
                id="custom-start-date"
                type="date"
                value={draftStartDate}
                onChange={(event) => setDraftStartDate(event.target.value)}
              />
            </div>
            <div className="dashboard-toolbar__field">
              <label htmlFor="custom-end-date">结束日期</label>
              <input
                id="custom-end-date"
                type="date"
                value={draftEndDate}
                onChange={(event) => setDraftEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="dashboard-toolbar__actions">
            <button
              type="button"
              className="dashboard-toolbar__apply"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  rangeKey: 'custom',
                  startDate: draftStartDate || undefined,
                  endDate: draftEndDate || undefined,
                })
              }
            >
              应用时间范围
            </button>
          </div>
        </>
      ) : (
        <div className="dashboard-toolbar__actions">
          <button
            type="button"
            className="dashboard-toolbar__apply"
            onClick={() =>
              onFiltersChange({
                ...filters,
                rangeKey: 'custom',
              })
            }
          >
            应用时间范围
          </button>
        </div>
      )}

      <p className="dashboard-toolbar__summary">{summary}</p>
    </section>
  );
}
