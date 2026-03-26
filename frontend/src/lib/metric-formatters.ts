import type { OverviewSummaryPayload } from './overview-contracts';

export interface MetricDisplay {
  value: string;
  deltaText?: string;
  deltaTone?: 'danger' | 'success' | 'neutral';
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  const percentage = value * 100;
  return `${percentage.toFixed(2).replace(/\.?0+$/, '')}%`;
}

function toDeltaResult(
  text: string,
  tone: 'danger' | 'success' | 'neutral' = 'neutral',
): Pick<MetricDisplay, 'deltaText' | 'deltaTone'> {
  return {
    deltaText: text,
    deltaTone: tone,
  };
}

function formatCountDelta(current: number, previous: number | null): Pick<MetricDisplay, 'deltaText' | 'deltaTone'> {
  if (previous === null || previous === 0) {
    return toDeltaResult('N/A');
  }

  const delta = current - previous;
  if (delta === 0) {
    return toDeltaResult('较上期 --');
  }

  const absolute = formatInteger(Math.abs(delta));
  return delta > 0
    ? toDeltaResult(`较上期 +${absolute}`, 'danger')
    : toDeltaResult(`较上期 -${absolute}`, 'success');
}

function formatRatioDelta(
  current: number | null,
  previous: number | null,
): Pick<MetricDisplay, 'deltaText' | 'deltaTone'> {
  if (current === null || previous === null || previous === 0) {
    return toDeltaResult('N/A');
  }

  const delta = current - previous;
  if (delta === 0) {
    return toDeltaResult('较上期 --');
  }

  const absolute = formatPercent(Math.abs(delta));
  return delta > 0
    ? toDeltaResult(`较上期 ↑${absolute}`, 'danger')
    : toDeltaResult(`较上期 ↓${absolute}`, 'success');
}

export function formatOutpatientMetric(
  summary: OverviewSummaryPayload,
  previousSummary: OverviewSummaryPayload | null,
): MetricDisplay {
  return {
    value: formatInteger(summary.outpatient_count),
    ...formatCountDelta(summary.outpatient_count, previousSummary?.outpatient_count ?? null),
  };
}

export function formatEvaluatedMetric(
  summary: OverviewSummaryPayload,
  previousSummary: OverviewSummaryPayload | null,
): MetricDisplay {
  return {
    value: formatInteger(summary.success_evaluated_count),
    ...formatCountDelta(summary.success_evaluated_count, previousSummary?.success_evaluated_count ?? null),
  };
}

export function formatDiagnosisBasisMetric(
  summary: OverviewSummaryPayload,
  previousSummary: OverviewSummaryPayload | null,
): MetricDisplay {
  return {
    value:
      summary.diagnosis_basis_incomplete_rate_by_success === null
        ? 'N/A'
        : formatPercent(summary.diagnosis_basis_incomplete_rate_by_success),
    ...formatRatioDelta(
      summary.diagnosis_basis_incomplete_rate_by_success,
      previousSummary?.diagnosis_basis_incomplete_rate_by_success ?? null,
    ),
  };
}

export function formatMissingDiagnosisMetric(
  summary: OverviewSummaryPayload,
  previousSummary: OverviewSummaryPayload | null,
): MetricDisplay {
  return {
    value:
      summary.missing_diagnosis_rate_by_success === null
        ? 'N/A'
        : formatPercent(summary.missing_diagnosis_rate_by_success),
    ...formatRatioDelta(
      summary.missing_diagnosis_rate_by_success,
      previousSummary?.missing_diagnosis_rate_by_success ?? null,
    ),
  };
}

export function formatQualityIndexMetric(): MetricDisplay {
  return {
    value: '待定义',
  };
}
