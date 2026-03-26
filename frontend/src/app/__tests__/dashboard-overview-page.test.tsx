import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardOverviewPage } from '../dashboard-overview-page';

vi.mock('../../lib/overview-api', () => ({
  loadOverview: vi.fn(() =>
    Promise.resolve({
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
      summary: {
        outpatient_count: 0,
        unique_patient_outpatient_count: 0,
        triggered_evaluation_count: 0,
        success_evaluated_count: 0,
        diagnosis_basis_incomplete_rate_by_success: null,
        diagnosis_basis_incomplete_rate_by_encounter: null,
        missing_diagnosis_rate_by_success: null,
        missing_diagnosis_rate_by_encounter: null,
        range_start_date: '2025-12-22',
        range_end_date: '2026-03-23',
        bucket_grain: 'week',
      },
      previous_summary: null,
    }),
  ),
}));

vi.mock('../../lib/trend-api', () => ({
  loadTrend: vi.fn(() =>
    Promise.resolve({
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
    }),
  ),
}));

vi.mock('../../lib/distribution-api', () => ({
  loadDepartmentDistribution: vi.fn(() =>
    Promise.resolve({
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
      available_department_types: [{ department_type_id: 'dept-type-ob', department_type_name: '妇产门诊' }],
      rows: [],
    }),
  ),
}));

vi.mock('../../lib/disease-insights-api', () => ({
  loadDiseaseInsights: vi.fn(() =>
    Promise.resolve({
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
      rows: [],
    }),
  ),
}));

describe('DashboardOverviewPage', () => {
  it('renders the default last_3_months state and all sections', async () => {
    render(<DashboardOverviewPage now={new Date('2026-03-25T09:00:00+08:00')} />);

    expect(screen.getByRole('button', { name: '近三个月' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/截止昨日（2026-03-24）/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '概览指标' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '诊断质量趋势' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '科室诊断质量分布' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '高发问题病种' })).toBeInTheDocument();
  });

  it('updates page-level filters after applying a custom range', () => {
    render(<DashboardOverviewPage now={new Date('2026-03-25T09:00:00+08:00')} />);

    fireEvent.click(screen.getByRole('button', { name: '自定义时间' }));
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2026-02-28' } });
    fireEvent.click(screen.getByRole('button', { name: '应用时间范围' }));

    expect(screen.getByText('统计范围 2026-02-01 至 2026-02-28 · 截止昨日（2026-03-24）')).toBeInTheDocument();
  });
});
