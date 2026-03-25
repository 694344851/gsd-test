import { useState } from 'react';

import type { EmrEncounterContext } from '../lib/emr-encounter-contracts';
import type { RealtimeEvaluationRequest, RealtimeEvaluationResponse } from '../lib/realtime-evaluation-contracts';
import { runRealtimeEvaluation } from '../lib/realtime-evaluation-api';
import { EvaluationResultCard } from './evaluation-result-card';
import { EvaluationSuggestionList } from './evaluation-suggestion-list';
import { EvaluationSummaryBanner } from './evaluation-summary-banner';

export interface DoctorEvaluationPanelProps {
  encounter: EmrEncounterContext;
  onRunEvaluation?: (request: RealtimeEvaluationRequest) => Promise<RealtimeEvaluationResponse>;
}

function buildRequest(encounter: EmrEncounterContext): RealtimeEvaluationRequest {
  return {
    encounter_id: encounter.encounter_id,
    case_id: encounter.case_id,
    patient_id: encounter.patient.patient_id,
    triggered_by_doctor_id: encounter.doctor.doctor_id,
    encounter_snapshot: {
      chief_complaint: encounter.sections.chief_complaint,
      history_of_present_illness: encounter.sections.history_of_present_illness,
      physical_exam: encounter.sections.physical_exam,
      auxiliary_exam: encounter.sections.auxiliary_exam,
      diagnoses: encounter.diagnoses.map((diagnosis) => ({
        disease_code: diagnosis.disease_code,
        disease_name: diagnosis.disease_name,
        is_primary: diagnosis.is_primary,
      })),
    },
  };
}

const DEFAULT_ASSISTIVE_NOTICE = '本结果仅用于辅助诊断质量评估，不替代医生临床判断。';

export function DoctorEvaluationPanel({
  encounter,
  onRunEvaluation = runRealtimeEvaluation,
}: DoctorEvaluationPanelProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'timeout' | 'error'>('idle');
  const [result, setResult] = useState<RealtimeEvaluationResponse | null>(null);

  const runEvaluation = async () => {
    if (status === 'loading') {
      return;
    }

    setStatus('loading');
    setResult(null);

    try {
      const response = await onRunEvaluation(buildRequest(encounter));
      setResult(response);
      setStatus(response.status === 'success' ? 'success' : response.status === 'timeout' ? 'timeout' : 'error');
    } catch {
      setResult(null);
      setStatus('error');
    }
  };

  return (
    <section className="dashboard-panel" aria-label="诊鉴触发区域">
      <h2 className="dashboard-panel__heading">诊鉴触发</h2>
      <div className="module-state">
        <h3 className="module-state__heading">诊鉴</h3>
        <p className="module-state__body">
          系统将基于当前主诉、现病史、查体、辅助检查和已录入诊断进行辅助评估，不替代医生临床判断。
        </p>
        <button
          className="dashboard-toolbar__apply"
          type="button"
          onClick={() => {
            void runEvaluation();
          }}
          disabled={status === 'loading'}
        >
          诊鉴
        </button>
      </div>

      {status === 'idle' ? (
        <div className="module-state">
          <h3 className="module-state__heading">等待触发后返回结构化辅助评估</h3>
          <p className="module-state__body">
            结果区域将固定展示诊断依据完整性、潜在缺漏诊断、评估依据和行动建议。
          </p>
          <p className="module-state__body">{DEFAULT_ASSISTIVE_NOTICE}</p>
        </div>
      ) : null}

      {status === 'loading' ? (
        <EvaluationSummaryBanner status="loading" assistiveNotice={DEFAULT_ASSISTIVE_NOTICE} />
      ) : null}

      {status === 'timeout' ? (
        <EvaluationSummaryBanner
          status="timeout"
          assistiveNotice={result?.assistive_notice ?? DEFAULT_ASSISTIVE_NOTICE}
          elapsedMs={result?.elapsed_ms}
        />
      ) : null}

      {status === 'error' ? (
        <EvaluationSummaryBanner
          status="error"
          assistiveNotice={result?.assistive_notice ?? DEFAULT_ASSISTIVE_NOTICE}
          elapsedMs={result?.elapsed_ms}
        />
      ) : null}

      {status === 'success' && result !== null ? (
        <div className="dashboard-layout">
          <EvaluationSummaryBanner
            status="success"
            assistiveNotice={result.assistive_notice}
            elapsedMs={result.elapsed_ms}
          />
          <div className="overview-grid">
            <EvaluationResultCard title="诊断依据完整性">
              <p>{result.basis_completeness.summary}</p>
              <p>
                判定：
                {result.basis_completeness.verdict === 'complete' ? '依据完整' : '依据不完整'}
              </p>
              <EvaluationSuggestionList
                heading="待补充项"
                items={result.basis_completeness.missing_items}
                emptyText="当前未发现待补充的关键依据。"
              />
            </EvaluationResultCard>

            <EvaluationResultCard title="潜在缺漏诊断">
              {result.potential_missing_diagnoses.length > 0 ? (
                <ul>
                  {result.potential_missing_diagnoses.map((diagnosis) => (
                    <li key={`${diagnosis.disease_name}-${diagnosis.confidence_label}`}>
                      {diagnosis.disease_name} · {diagnosis.confidence_label} · {diagnosis.rationale}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>当前未提示新的潜在缺漏诊断。</p>
              )}
            </EvaluationResultCard>

            <EvaluationResultCard title="评估依据">
              <EvaluationSuggestionList
                heading="系统依据"
                items={result.rationale}
                emptyText="当前没有返回额外评估依据。"
              />
            </EvaluationResultCard>

            <EvaluationResultCard title="行动建议">
              <EvaluationSuggestionList
                heading="建议动作"
                items={result.suggestions}
                emptyText="当前没有返回额外行动建议。"
              />
            </EvaluationResultCard>
          </div>
        </div>
      ) : null}
    </section>
  );
}
