import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DiseaseInsightsSection } from '../disease-insights-section';

vi.mock('../../lib/disease-insights-api', () => ({
  loadDiseaseInsights: vi.fn(),
}));

const { loadDiseaseInsights } = await import('../../lib/disease-insights-api');

const filters = {
  asOfDate: '2026-03-24',
  rangeKey: 'last_3_months' as const,
};

describe('DiseaseInsightsSection', () => {
  it('renders deterministic disease cloud items', async () => {
    const onDrilldown = vi.fn();
    vi.mocked(loadDiseaseInsights).mockResolvedValue({
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
      rows: [
        {
          disease_id: 'disease-c',
          disease_name: '疾病C',
          issue_count: 4,
          diagnosis_basis_incomplete_count: 2,
          missing_diagnosis_count: 2,
          severity_ratio: 1,
          severity_band: 'top_20',
        },
      ],
    });

    render(<DiseaseInsightsSection filters={filters} onDrilldown={onDrilldown} />);

    expect(await screen.findByRole('heading', { name: '高发问题病种' })).toBeInTheDocument();
    expect(screen.getByText('疾病C')).toBeInTheDocument();
    expect(screen.getByText(/问题数 4/)).toBeInTheDocument();
    expect(screen.getByTestId('disease-cloud')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /疾病C/ }));
    expect(onDrilldown).toHaveBeenCalledWith({
      dimension: 'disease',
      dimension_value: 'disease-c',
      dimension_label: '疾病C',
      source_module: 'disease_insights',
      filters,
    });
  });

  it('renders empty state', async () => {
    vi.mocked(loadDiseaseInsights).mockResolvedValue({
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
    });

    render(<DiseaseInsightsSection filters={filters} />);
    expect(await screen.findByText('当前时间范围暂无诊鉴数据')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.mocked(loadDiseaseInsights).mockRejectedValue(new Error('boom'));

    render(<DiseaseInsightsSection filters={filters} />);
    expect(await screen.findByText('首页数据加载失败，请刷新页面或稍后重试。')).toBeInTheDocument();
  });
});
