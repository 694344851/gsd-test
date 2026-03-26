import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OverviewSection } from '../overview-section';

vi.mock('../../lib/overview-api', () => ({
  loadOverview: vi.fn(),
}));

const { loadOverview } = await import('../../lib/overview-api');

const filters = {
  asOfDate: '2026-03-24',
  rangeKey: 'last_3_months' as const,
};

describe('OverviewSection', () => {
  it('renders five cards with delta rules and quality placeholder', async () => {
    vi.mocked(loadOverview).mockResolvedValue({
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
        outpatient_count: 120,
        unique_patient_outpatient_count: 118,
        triggered_evaluation_count: 100,
        success_evaluated_count: 90,
        diagnosis_basis_incomplete_rate_by_success: 0.1,
        diagnosis_basis_incomplete_rate_by_encounter: 0.1,
        missing_diagnosis_rate_by_success: 0.2,
        missing_diagnosis_rate_by_encounter: 0.2,
        range_start_date: '2025-12-22',
        range_end_date: '2026-03-23',
        bucket_grain: 'week',
      },
      previous_summary: {
        outpatient_count: 100,
        unique_patient_outpatient_count: 100,
        triggered_evaluation_count: 80,
        success_evaluated_count: 90,
        diagnosis_basis_incomplete_rate_by_success: null,
        diagnosis_basis_incomplete_rate_by_encounter: null,
        missing_diagnosis_rate_by_success: 0.2,
        missing_diagnosis_rate_by_encounter: 0.2,
        range_start_date: '2025-09-19',
        range_end_date: '2025-12-21',
        bucket_grain: 'week',
      },
    });

    render(<OverviewSection filters={filters} />);

    await waitFor(() => {
      expect(screen.getByText('门诊量')).toBeInTheDocument();
    });

    expect(screen.getByText('评估病例数')).toBeInTheDocument();
    expect(screen.getByText('诊断依据不完整比例')).toBeInTheDocument();
    expect(screen.getByText('缺失诊断比例')).toBeInTheDocument();
    expect(screen.getByText('整体诊断质量指数')).toBeInTheDocument();
    expect(screen.getByText('较上期 +20')).toBeInTheDocument();
    expect(screen.getAllByText('较上期 --')).toHaveLength(2);
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText('待定义')).toBeInTheDocument();
  });

  it('renders the empty state when the selected range has no data', async () => {
    vi.mocked(loadOverview).mockResolvedValue({
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
    });

    render(<OverviewSection filters={filters} />);

    expect(await screen.findByText('当前时间范围暂无诊鉴数据')).toBeInTheDocument();
    expect(screen.getByText('请更换时间范围后重试。')).toBeInTheDocument();
  });

  it('renders the error state when loading fails', async () => {
    vi.mocked(loadOverview).mockRejectedValue(new Error('boom'));

    render(<OverviewSection filters={filters} />);

    expect(await screen.findByText('首页数据加载失败，请刷新页面或稍后重试。')).toBeInTheDocument();
  });
});
