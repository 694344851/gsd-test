import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildDrilldownSearch, type ManagerDrilldownRequest } from '../../lib/manager-drilldown-contracts';
import { ManagerDrilldownPage } from '../manager-drilldown-page';

const request: ManagerDrilldownRequest = {
  dimension: 'department',
  dimension_value: 'dept-ob',
  dimension_label: '产科门诊',
  source_module: 'distribution',
  filters: {
    asOfDate: '2026-03-24',
    rangeKey: 'last_3_months',
  },
};

describe('ManagerDrilldownPage', () => {
  it('renders parsed URL state and loaded case rows', async () => {
    const onLoadDrilldown = vi.fn().mockResolvedValue({
      request,
      summary: {
        total_case_count: 1,
        diagnosis_basis_incomplete_count: 1,
        missing_diagnosis_count: 0,
      },
      rows: [
        {
          encounter_id: 'enc-001',
          patient_name: '王丽',
          department_name: '产科门诊',
          doctor_name: '张晓明',
          primary_diagnosis_name: '高血压',
          evaluation_status: 'success',
          diagnosis_basis_incomplete: true,
          missing_diagnosis: false,
          triggered_at: '2026-03-24T09:12:00+08:00',
        },
      ],
    });

    render(
      <ManagerDrilldownPage
        search={buildDrilldownSearch(request)}
        onBack={vi.fn()}
        onLoadDrilldown={onLoadDrilldown}
      />,
    );

    expect(screen.getByText('问题病例明细加载中')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /产科门诊/ })).toBeInTheDocument();
    expect(screen.getByText('问题病例列表')).toBeInTheDocument();
    expect(screen.getByTestId('problem-case-table')).toBeInTheDocument();
    expect(screen.getByText('enc-001')).toBeInTheDocument();
  });

  it('renders empty state when no rows exist', async () => {
    const onLoadDrilldown = vi.fn().mockResolvedValue({
      request,
      summary: {
        total_case_count: 0,
        diagnosis_basis_incomplete_count: 0,
        missing_diagnosis_count: 0,
      },
      rows: [],
    });

    render(
      <ManagerDrilldownPage
        search={buildDrilldownSearch(request)}
        onBack={vi.fn()}
        onLoadDrilldown={onLoadDrilldown}
      />,
    );

    expect(await screen.findByText('当前筛选范围暂无问题病例')).toBeInTheDocument();
  });

  it('renders error state for invalid URL state', async () => {
    render(<ManagerDrilldownPage search="?view=manager-drilldown" onBack={vi.fn()} onLoadDrilldown={vi.fn()} />);

    expect(await screen.findByText('下钻参数无效或数据加载失败')).toBeInTheDocument();
  });

  it('renders error state when the loader fails', async () => {
    const onLoadDrilldown = vi.fn().mockRejectedValue(new Error('boom'));

    render(
      <ManagerDrilldownPage
        search={buildDrilldownSearch(request)}
        onBack={vi.fn()}
        onLoadDrilldown={onLoadDrilldown}
      />,
    );

    expect(await screen.findByText('下钻参数无效或数据加载失败')).toBeInTheDocument();
  });

  it('blocks doctor viewers from manager drilldown access', () => {
    render(
      <ManagerDrilldownPage
        search={buildDrilldownSearch(request)}
        onBack={vi.fn()}
        viewerContext={{ viewer_role: 'doctor', viewer_id: 'doctor-001' }}
      />,
    );

    expect(screen.getByText('当前角色无权访问管理端下钻')).toBeInTheDocument();
  });
});
