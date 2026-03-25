import type { EmrEncounterContext } from '../lib/emr-encounter-contracts';

export interface DoctorEvaluationPageProps {
  encounter: EmrEncounterContext;
}

function renderSectionPreview(label: string, value?: string) {
  return (
    <article className="overview-card">
      <p className="overview-card__label">{label}</p>
      <p className="module-state__body">{value && value.trim().length > 0 ? value : '待宿主病历上下文补充'}</p>
    </article>
  );
}

export function DoctorEvaluationPage({ encounter }: DoctorEvaluationPageProps) {
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

      <section className="dashboard-panel" aria-label="诊鉴触发区域">
        <h2 className="dashboard-panel__heading">诊鉴触发</h2>
        <div className="module-state">
          <h3 className="module-state__heading">诊鉴</h3>
          <p className="module-state__body">
            系统将基于当前主诉、现病史、查体、辅助检查和已录入诊断进行辅助评估，不替代医生临床判断。
          </p>
          <button className="dashboard-toolbar__apply" type="button">
            诊鉴
          </button>
        </div>
      </section>

      <section className="dashboard-panel" aria-label="病历片段预览">
        <h2 className="dashboard-panel__heading">病历片段预览</h2>
        <div className="overview-grid">
          {renderSectionPreview('主诉', encounter.sections.chief_complaint)}
          {renderSectionPreview('现病史', encounter.sections.history_of_present_illness)}
          {renderSectionPreview('查体', encounter.sections.physical_exam)}
          {renderSectionPreview('辅助检查', encounter.sections.auxiliary_exam)}
        </div>
      </section>

      <section className="dashboard-panel" aria-label="结果预留区域">
        <h2 className="dashboard-panel__heading">评估结果</h2>
        <div className="module-state">
          <h3 className="module-state__heading">等待触发后返回结构化辅助评估</h3>
          <p className="module-state__body">
            结果区域将固定展示诊断依据完整性、潜在缺漏诊断、评估依据和行动建议。
          </p>
        </div>
      </section>
    </main>
  );
}
