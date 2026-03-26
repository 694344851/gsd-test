import type { DrilldownIntent, ManagerDrilldownSummary } from '../lib/manager-drilldown-contracts';
import { formatFiltersSummary } from '../lib/manager-drilldown-contracts';

export interface DrilldownFilterSummaryProps {
  intent: DrilldownIntent;
  summary: ManagerDrilldownSummary;
}

export function DrilldownFilterSummary({ intent, summary }: DrilldownFilterSummaryProps) {
  return (
    <section className="drilldown-summary" aria-label="下钻范围摘要">
      <div className="drilldown-summary__hero">
        <p className="drilldown-summary__eyebrow">{intent.source_module === 'distribution' ? '科室分布下钻' : '病种洞察下钻'}</p>
        <h2 className="drilldown-summary__title">
          {intent.dimension_label}
          <span className="drilldown-summary__dimension"> · {intent.dimension}</span>
        </h2>
        <p className="drilldown-summary__filters">{formatFiltersSummary(intent.filters)}</p>
      </div>
      <dl className="drilldown-summary__stats">
        <div>
          <dt>问题病例</dt>
          <dd>{summary.total_case_count}</dd>
        </div>
        <div>
          <dt>依据不完整</dt>
          <dd>{summary.diagnosis_basis_incomplete_count}</dd>
        </div>
        <div>
          <dt>缺漏诊断</dt>
          <dd>{summary.missing_diagnosis_count}</dd>
        </div>
      </dl>
    </section>
  );
}
