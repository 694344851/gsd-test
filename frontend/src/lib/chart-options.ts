import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts';

import type { TrendSeriesPayload } from './trend-contracts';

const SERIES_NAMES = {
  outpatientCount: '门诊量',
  evaluatedCount: '评估病例数',
  incompleteRate: '诊断依据不完整比例',
  missingRate: '缺失诊断比例',
} as const;

const COLORS = {
  outpatientBar: '#C9CED6',
  evaluatedBar: '#2F6BFF',
  incompleteLine: '#F59E0B',
  missingLine: '#D14343',
  border: '#E5E7EB',
  text: '#1F2937',
  muted: '#6B7280',
} as const;

type TooltipParam = TooltipComponentFormatterCallbackParams | TooltipComponentFormatterCallbackParams[];

function formatInteger(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }
  return String(Math.round(value));
}

function toPercentValue(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  return value * 100;
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  const formatted = value.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted}%`;
}

function getTooltipMarker(params: TooltipComponentFormatterCallbackParams): string {
  return typeof params.marker === 'string' ? params.marker : '';
}

function normalizeTooltipParams(params: TooltipParam): TooltipComponentFormatterCallbackParams[] {
  return Array.isArray(params) ? params : [params];
}

function findParam(
  params: TooltipComponentFormatterCallbackParams[],
  seriesName: string,
): TooltipComponentFormatterCallbackParams | undefined {
  return params.find((item) => item.seriesName === seriesName);
}

function tooltipRow(
  params: TooltipComponentFormatterCallbackParams | undefined,
  label: string,
  value: string,
): string {
  const marker = params ? getTooltipMarker(params) : '';
  return `<div style="display:flex;justify-content:space-between;gap:16px;"><span>${marker}${label}</span><strong>${value}</strong></div>`;
}

export function formatTrendTooltip(params: TooltipParam): string {
  const entries = normalizeTooltipParams(params);
  const label = typeof entries[0]?.axisValueLabel === 'string' ? entries[0].axisValueLabel : '';
  const outpatient = findParam(entries, SERIES_NAMES.outpatientCount);
  const evaluated = findParam(entries, SERIES_NAMES.evaluatedCount);
  const incomplete = findParam(entries, SERIES_NAMES.incompleteRate);
  const missing = findParam(entries, SERIES_NAMES.missingRate);

  return [
    `<div style="display:grid;gap:8px;color:${COLORS.text};">`,
    `<div style="font-weight:600;">${label}</div>`,
    tooltipRow(outpatient, SERIES_NAMES.outpatientCount, formatInteger(outpatient?.data as number | null | undefined)),
    tooltipRow(evaluated, SERIES_NAMES.evaluatedCount, formatInteger(evaluated?.data as number | null | undefined)),
    tooltipRow(incomplete, SERIES_NAMES.incompleteRate, formatPercent(incomplete?.data as number | null | undefined)),
    tooltipRow(missing, SERIES_NAMES.missingRate, formatPercent(missing?.data as number | null | undefined)),
    `</div>`,
  ].join('');
}

function buildBarSeries(rows: TrendSeriesPayload[]): EChartsOption['series'] {
  return [
    {
      name: SERIES_NAMES.outpatientCount,
      type: 'bar',
      yAxisIndex: 1,
      barWidth: 18,
      itemStyle: { color: COLORS.outpatientBar, borderRadius: [6, 6, 0, 0] },
      emphasis: { focus: 'series' },
      data: rows.map((row) => row.outpatient_count),
    },
    {
      name: SERIES_NAMES.evaluatedCount,
      type: 'bar',
      yAxisIndex: 1,
      barWidth: 18,
      barGap: '-100%',
      itemStyle: { color: COLORS.evaluatedBar, borderRadius: [6, 6, 0, 0] },
      emphasis: { focus: 'series' },
      data: rows.map((row) => row.success_evaluated_count),
    },
  ];
}

function buildLineSeries(rows: TrendSeriesPayload[]): EChartsOption['series'] {
  return [
    {
      name: SERIES_NAMES.incompleteRate,
      type: 'line',
      yAxisIndex: 0,
      smooth: true,
      connectNulls: false,
      symbolSize: 8,
      itemStyle: { color: COLORS.incompleteLine },
      lineStyle: { color: COLORS.incompleteLine, width: 3 },
      data: rows.map((row) => toPercentValue(row.diagnosis_basis_incomplete_rate_by_success)),
    },
    {
      name: SERIES_NAMES.missingRate,
      type: 'line',
      yAxisIndex: 0,
      smooth: true,
      connectNulls: false,
      symbolSize: 8,
      itemStyle: { color: COLORS.missingLine },
      lineStyle: { color: COLORS.missingLine, width: 3 },
      data: rows.map((row) => toPercentValue(row.missing_diagnosis_rate_by_success)),
    },
  ];
}

export function buildTrendChartOption(rows: TrendSeriesPayload[]): EChartsOption {
  const barSeries = buildBarSeries(rows) ?? [];
  const lineSeries = buildLineSeries(rows) ?? [];

  return {
    animation: false,
    color: [
      COLORS.outpatientBar,
      COLORS.evaluatedBar,
      COLORS.incompleteLine,
      COLORS.missingLine,
    ],
    grid: {
      left: 12,
      right: 12,
      top: 24,
      bottom: 12,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 12,
      textStyle: {
        color: COLORS.text,
      },
      formatter: formatTrendTooltip,
    },
    legend: {
      top: 0,
      textStyle: {
        color: COLORS.muted,
      },
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { lineStyle: { color: COLORS.border } },
      axisLabel: { color: COLORS.muted },
      data: rows.map((row) => row.bucket_label),
    },
    yAxis: [
      {
        type: 'value',
        name: rows[0]?.bucket_grain ? `比例 (${rows[0].bucket_grain})` : '比例',
        min: 0,
        axisLabel: {
          color: COLORS.muted,
          formatter: (value: number) => `${value}%`,
        },
        splitLine: {
          lineStyle: { color: COLORS.border, type: 'dashed' },
        },
      },
      {
        type: 'value',
        name: '病例数',
        min: 0,
        axisLabel: {
          color: COLORS.muted,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [...barSeries, ...lineSeries],
  };
}
