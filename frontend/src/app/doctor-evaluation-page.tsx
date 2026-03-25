import type { EmrEncounterContext } from '../lib/emr-encounter-contracts';
import type { RealtimeEvaluationRequest, RealtimeEvaluationResponse } from '../lib/realtime-evaluation-contracts';
import { DoctorEvaluationPanel } from '../components/doctor-evaluation-panel';

export interface DoctorEvaluationPageProps {
  encounter: EmrEncounterContext;
  onRunEvaluation?: (request: RealtimeEvaluationRequest) => Promise<RealtimeEvaluationResponse>;
}

function renderSectionPreview(label: string, value?: string) {
  return (
    <article className="overview-card">
      <p className="overview-card__label">{label}</p>
      <p className="module-state__body">{value && value.trim().length > 0 ? value : '待宿主病历上下文补充'}</p>
    </article>
  );
}

const defaultRunEvaluation = async (): Promise<RealtimeEvaluationResponse> => ({
  evaluation_id: 'pending-host-integration',
  status: 'failed',
  elapsed_ms: 0,
  assistive_notice: '本结果仅用于辅助诊断质量评估，不替代医生临床判断。',
  basis_completeness: {
    verdict: 'incomplete',
    summary: '当前页面尚未接入后端诊鉴执行能力。',
    missing_items: [],
  },
  potential_missing_diagnoses: [],
  rationale: ['请在后续计划中接入后端诊鉴服务。'],
  suggestions: ['确认宿主已注入 onRunEvaluation(request) 回调。'],
});

export function DoctorEvaluationPage({ encounter, onRunEvaluation = defaultRunEvaluation }: DoctorEvaluationPageProps) {
  return (
    <main className="dashboard-page">
      <header className="dashboard-page__hero">
        <h1 className="dashboard-page__title">门诊实时诊鉴</h1>
        <p className="dashboard-page__subtitle">
          在不打断病历录入的前提下，对当前就诊病历提供结构化辅助评估。
        </p>
      </header>

      <section className="dashboard-panel" aria-label="病历上下文">
        <h2 className="dashboard-panel__heading">当前病历上下文</h2>
        <div className="overview-grid">
          <article className="overview-card">
            <p className="overview-card__label">患者</p>
            <p className="overview-card__value">{encounter.patient.patient_name}</p>
            <p className="module-state__body">
              病历号 {encounter.case_id} · 就诊号 {encounter.encounter_id}
            </p>
          </article>
          <article className="overview-card">
            <p className="overview-card__label">接诊医生</p>
            <p className="overview-card__value">{encounter.doctor.doctor_name}</p>
            <p className="module-state__body">
              {encounter.doctor.department_name ?? '待补充科室'} · {encounter.doctor.title ?? '门诊医生'}
            </p>
          </article>
          <article className="overview-card">
            <p className="overview-card__label">当前诊断</p>
            <p className="overview-card__value">{encounter.diagnoses.length}</p>
            <p className="module-state__body">
              {encounter.diagnoses.map((diagnosis) => diagnosis.disease_name).join('、') || '尚未录入诊断'}
            </p>
          </article>
        </div>
      </section>

      <DoctorEvaluationPanel encounter={encounter} onRunEvaluation={onRunEvaluation} />

      <section className="dashboard-panel" aria-label="病历片段预览">
        <h2 className="dashboard-panel__heading">病历片段预览</h2>
        <div className="overview-grid">
          {renderSectionPreview('主诉', encounter.sections.chief_complaint)}
          {renderSectionPreview('现病史', encounter.sections.history_of_present_illness)}
          {renderSectionPreview('查体', encounter.sections.physical_exam)}
          {renderSectionPreview('辅助检查', encounter.sections.auxiliary_exam)}
        </div>
      </section>

    </main>
  );
}
