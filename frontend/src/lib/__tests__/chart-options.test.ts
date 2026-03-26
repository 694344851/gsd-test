import type { TooltipComponentFormatterCallbackParams } from 'echarts';
import { describe, expect, it } from 'vitest';

import { buildTrendChartOption, formatTrendTooltip } from '../chart-options';
import type { TrendSeriesPayload } from '../trend-contracts';

const rows: TrendSeriesPayload[] = [
  {
    outpatient_count: 120,
    unique_patient_outpatient_count: 118,
    triggered_evaluation_count: 92,
    success_evaluated_count: 88,
    diagnosis_basis_incomplete_rate_by_success: 0.1148,
    diagnosis_basis_incomplete_rate_by_encounter: 0.09,
    missing_diagnosis_rate_by_success: null,
    missing_diagnosis_rate_by_encounter: null,
    range_start_date: '2026-01-01',
    range_end_date: '2026-03-24',
    bucket_grain: 'week',
    bucket_start: '2026-03-01',
    bucket_end: '2026-03-07',
    bucket_label: '03-01 至 03-07',
  },
];

function createTooltipParam(
  seriesName: string,
  data: number | null,
  marker: string,
): TooltipComponentFormatterCallbackParams {
  return {
    componentType: 'series',
    seriesType: seriesName.includes('比例') ? 'line' : 'bar',
    seriesIndex: 0,
    seriesName,
    name: rows[0].bucket_label,
    dataIndex: 0,
    data,
    value: data,
    color: '#000',
    marker,
    axisValue: rows[0].bucket_label,
    axisValueLabel: rows[0].bucket_label,
  } as TooltipComponentFormatterCallbackParams;
}

describe('buildTrendChartOption', () => {
  it('maps bucket labels and dual-axis series directly from backend rows', () => {
    const option = buildTrendChartOption(rows);

    expect(option.xAxis).toMatchObject({
      data: [rows[0].bucket_label],
    });

    expect(option.series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '门诊量', type: 'bar', yAxisIndex: 1 }),
        expect.objectContaining({
          name: '评估病例数',
          type: 'bar',
          yAxisIndex: 1,
          barGap: '-100%',
        }),
        expect.objectContaining({ name: '诊断依据不完整比例', type: 'line', yAxisIndex: 0 }),
        expect.objectContaining({ name: '缺失诊断比例', type: 'line', yAxisIndex: 0 }),
      ]),
    );

    expect(option.tooltip).toMatchObject({
      trigger: 'axis',
      borderColor: '#E5E7EB',
    });
  });

  it('renders tooltip rows in the locked order and preserves missing ratios as unavailable', () => {
    const tooltip = formatTrendTooltip([
      createTooltipParam('门诊量', 120, '<span>1</span>'),
      createTooltipParam('评估病例数', 88, '<span>2</span>'),
      createTooltipParam('诊断依据不完整比例', 11.48, '<span>3</span>'),
      createTooltipParam('缺失诊断比例', null, '<span>4</span>'),
    ]);

    expect(tooltip).toContain(rows[0].bucket_label);
    expect(tooltip).toContain('门诊量');
    expect(tooltip).toContain('评估病例数');
    expect(tooltip).toContain('诊断依据不完整比例');
    expect(tooltip).toContain('缺失诊断比例');
    expect(tooltip).toContain('120');
    expect(tooltip).toContain('88');
    expect(tooltip).toContain('11.48%');
    expect(tooltip).toContain('--');

    expect(tooltip.indexOf('门诊量')).toBeLessThan(tooltip.indexOf('评估病例数'));
    expect(tooltip.indexOf('评估病例数')).toBeLessThan(tooltip.indexOf('诊断依据不完整比例'));
    expect(tooltip.indexOf('诊断依据不完整比例')).toBeLessThan(tooltip.indexOf('缺失诊断比例'));
  });
});
