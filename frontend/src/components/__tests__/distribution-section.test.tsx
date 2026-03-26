import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DistributionSection } from '../distribution-section';

vi.mock('../../lib/distribution-api', () => ({
  loadDepartmentDistribution: vi.fn(),
}));

vi.mock('../department-distribution-chart', () => ({
  DepartmentDistributionChart: () => <div data-testid="distribution-chart" />,
}));

const { loadDepartmentDistribution } = await import('../../lib/distribution-api');

const filters = {
  asOfDate: '2026-03-24',
  rangeKey: 'last_3_months' as const,
};

describe('DistributionSection', () => {
  it('renders chart and department type filter', async () => {
    const onFiltersChange = vi.fn();
    const onDrilldown = vi.fn();
    vi.mocked(loadDepartmentDistribution).mockResolvedValue({
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
      available_department_types: [
        { department_type_id: 'dept-type-ob', department_type_name: '妇产门诊' },
      ],
      rows: [
        {
          department_id: 'dept-ob',
          department_name: '产科门诊',
          department_type_id: 'dept-type-ob',
          department_type_name: '妇产门诊',
          outpatient_count: 100,
          success_evaluated_count: 20,
          diagnosis_basis_incomplete_rate_by_success: 0.1,
          missing_diagnosis_rate_by_success: 0.05,
        },
      ],
    });

    render(<DistributionSection filters={filters} onFiltersChange={onFiltersChange} onDrilldown={onDrilldown} />);

    expect(await screen.findByText('科室诊断质量分布')).toBeInTheDocument();
    expect(screen.getByLabelText('科室类型')).toBeInTheDocument();
    expect(screen.getByTestId('distribution-chart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看科室问题病例' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看重点医生问题病例' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('科室类型'), { target: { value: 'dept-type-ob' } });
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      departmentTypeIds: ['dept-type-ob'],
    });

    fireEvent.click(screen.getByRole('button', { name: '查看科室问题病例' }));
    expect(onDrilldown).toHaveBeenCalledWith({
      dimension: 'department',
      dimension_value: 'dept-ob',
      dimension_label: '产科门诊',
      source_module: 'distribution',
      filters,
    });

    fireEvent.click(screen.getByRole('button', { name: '查看重点医生问题病例' }));
    expect(onDrilldown).toHaveBeenCalledWith({
      dimension: 'doctor',
      dimension_value: 'doctor-001',
      dimension_label: '医生一',
      source_module: 'distribution',
      filters,
    });
  });

  it('renders empty state', async () => {
    vi.mocked(loadDepartmentDistribution).mockResolvedValue({
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
      available_department_types: [],
      rows: [],
    });

    render(<DistributionSection filters={filters} onFiltersChange={vi.fn()} />);
    expect(await screen.findByText('当前时间范围暂无诊鉴数据')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.mocked(loadDepartmentDistribution).mockRejectedValue(new Error('boom'));

    render(<DistributionSection filters={filters} onFiltersChange={vi.fn()} />);
    expect(await screen.findByText('首页数据加载失败，请刷新页面或稍后重试。')).toBeInTheDocument();
  });
});
