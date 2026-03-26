import type { OverviewSummaryPayload } from '../lib/overview-contracts';
import {
  formatDiagnosisBasisMetric,
  formatEvaluatedMetric,
  formatMissingDiagnosisMetric,
  formatOutpatientMetric,
  formatQualityIndexMetric,
  type MetricDisplay,
} from '../lib/metric-formatters';

interface OverviewCardGridProps {
  summary: OverviewSummaryPayload;
  previousSummary: OverviewSummaryPayload | null;
}

interface CardDefinition {
  label: string;
  metric: MetricDisplay;
}

function renderDeltaClass(metric: MetricDisplay): string {
  if (metric.deltaTone === 'danger') {
    return 'overview-card__delta is-danger';
  }
  if (metric.deltaTone === 'success') {
    return 'overview-card__delta is-success';
  }
  return 'overview-card__delta';
}

export function OverviewCardGrid({ summary, previousSummary }: OverviewCardGridProps) {
  const cards: CardDefinition[] = [
    { label: '门诊量', metric: formatOutpatientMetric(summary, previousSummary) },
    { label: '评估病例数', metric: formatEvaluatedMetric(summary, previousSummary) },
    { label: '诊断依据不完整比例', metric: formatDiagnosisBasisMetric(summary, previousSummary) },
    { label: '缺失诊断比例', metric: formatMissingDiagnosisMetric(summary, previousSummary) },
    { label: '整体诊断质量指数', metric: formatQualityIndexMetric() },
  ];

  return (
    <div className="overview-grid">
      {cards.map((card) => (
        <article key={card.label} className="overview-card">
          <p className="overview-card__label">{card.label}</p>
          <p className="overview-card__value">{card.metric.value}</p>
          {card.metric.deltaText ? <div className={renderDeltaClass(card.metric)}>{card.metric.deltaText}</div> : null}
        </article>
      ))}
    </div>
  );
}
