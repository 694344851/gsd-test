import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TrendSection } from '../trend-section';

vi.mock('../../lib/trend-api', () => ({
  loadTrend: vi.fn(),
}));

vi.mock('../../lib/chart-options', () => ({
  buildTrendChartOption: vi.fn(() => ({ tooltip: { trigger: 'axis' }, series: [] })),
}));

vi.mock('../diagnosis-trend-chart', () => ({
  DiagnosisTrendChart: ({ option }: { option: unknown }) => (
    <div data-testid="diagnosis-trend-chart">{JSON.stringify(option)}</div>
  ),
}));

const { loadTrend } = await import('../../lib/trend-api');
const { buildTrendChartOption } = await import('../../lib/chart-options');

const filters = {
  asOfDate: '2026-03-24',
  rangeKey: 'last_3_months' as const,
};

describe('TrendSection', () => {
  it('loads rows and builds the tooltip-contract chart option', async () => {
    const rows = [
      {
        outpatient_count: 120,
        unique_patient_outpatient_count: 118,
        triggered_evaluation_count: 90,
        success_evaluated_count: 80,
        diagnosis_basis_incomplete_rate_by_success: 0.1,
        diagnosis_basis_incomplete_rate_by_encounter: 0.1,
        missing_diagnosis_rate_by_success: null,
        missing_diagnosis_rate_by_encounter: null,
        range_start_date: '2025-12-22',
        range_end_date: '2026-03-23',
        bucket_grain: 'week' as const,
        bucket_start: '2026-03-01',
        bucket_end: '2026-03-07',
        bucket_label: '03-01 至 03-07',
      },
    ];

    vi.mocked(loadTrend).mockResolvedValue({
      filters: {
        as_of_date: '2026-03-24',
        range_key: 'last_3_months',
        start_date: null,
        end_date: null,
        department_ids: null,
        department_type_ids: null,
        doctor_ids: null,
        disease_ids: null,
      },
      series: rows,
    });

    render(<TrendSection filters={filters} />);

    await waitFor(() => {
      expect(buildTrendChartOption).toHaveBeenCalledWith(rows);
    });

    expect(screen.getByTestId('diagnosis-trend-chart')).toBeInTheDocument();
  });

  it('renders the empty state when there are no rows', async () => {
    vi.mocked(loadTrend).mockResolvedValue({
      filters: {
        as_of_date: '2026-03-24',
        range_key: 'last_3_months',
        start_date: null,
        end_date: null,
        department_ids: null,
        department_type_ids: null,
        doctor_ids: null,
        disease_ids: null,
      },
      series: [],
    });

    render(<TrendSection filters={filters} />);

    expect(await screen.findByText('当前时间范围暂无诊鉴数据')).toBeInTheDocument();
    expect(screen.getByText('请更换时间范围后重试。')).toBeInTheDocument();
  });

  it('renders the error copy on rejected fetches', async () => {
    vi.mocked(loadTrend).mockRejectedValue(new Error('boom'));

    render(<TrendSection filters={filters} />);

    expect(await screen.findByText('首页数据加载失败，请刷新页面或稍后重试。')).toBeInTheDocument();
  });
});
