import type { EChartsOption } from 'echarts';

import type { DepartmentDistributionRowPayload } from './distribution-contracts';

function formatPercent(value: number | null): string {
  if (value === null) {
    return '--';
  }
  return `${(value * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

export function buildDistributionChartOption(rows: DepartmentDistributionRowPayload[]): EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      formatter: (params: { data: DepartmentDistributionRowPayload }) => {
        const row = params.data;
        return [
          `<div style="display:grid;gap:8px;">`,
          `<div style="font-weight:600;">${row.department_name}</div>`,
          `<div>${row.department_type_name}</div>`,
          `<div>门诊量：${formatInteger(row.outpatient_count)}</div>`,
          `<div>评估病例数：${formatInteger(row.success_evaluated_count)}</div>`,
          `<div>诊断依据不完整比例：${formatPercent(row.diagnosis_basis_incomplete_rate_by_success)}</div>`,
          `<div>缺失诊断比例：${formatPercent(row.missing_diagnosis_rate_by_success)}</div>`,
          `</div>`,
        ].join('');
      },
    },
    xAxis: {
      type: 'value',
      name: '门诊量',
    },
    yAxis: {
      type: 'value',
      name: '诊断依据不完整比例',
      axisLabel: {
        formatter: (value: number) => `${value}%`,
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#dbeafe', '#93c5fd', '#2f6bff', '#1d4ed8'],
      },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (value: number[]) => Math.max(14, Math.min(42, value[2] * 6)),
        data: rows.map((row) => ({
          ...row,
          value: [
            row.outpatient_count,
            row.diagnosis_basis_incomplete_rate_by_success === null
              ? 0
              : row.diagnosis_basis_incomplete_rate_by_success * 100,
            row.success_evaluated_count,
            row.missing_diagnosis_rate_by_success === null
              ? 0
              : row.missing_diagnosis_rate_by_success * 100,
          ],
          itemStyle: {
            color:
              row.missing_diagnosis_rate_by_success === null
                ? '#C9CED6'
                : undefined,
          },
        })),
        encode: {
          x: 0,
          y: 1,
          tooltip: [0, 1, 2, 3],
        },
      },
    ],
  };
}
