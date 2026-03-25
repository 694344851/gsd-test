import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DoctorEvaluationPanel } from '../doctor-evaluation-panel';
import type { EmrEncounterContext } from '../../lib/emr-encounter-contracts';
import type { RealtimeEvaluationResponse } from '../../lib/realtime-evaluation-contracts';

const encounterFixture: EmrEncounterContext = {
  encounter_id: 'enc-1001',
  case_id: 'case-2002',
  patient: {
    patient_id: 'patient-3003',
    patient_name: '王小林',
  },
  doctor: {
    doctor_id: 'doctor-4004',
    doctor_name: '张医生',
    department_name: '妇科门诊',
  },
  sections: {
    chief_complaint: '停经 7 周，伴轻度恶心。',
    history_of_present_illness: '近 3 天晨起恶心，无腹痛。',
    physical_exam: '腹软无压痛。',
    auxiliary_exam: '尿妊娠试验阳性。',
  },
  diagnoses: [{ disease_name: '早孕待查', is_primary: true }],
};

const successResponse: RealtimeEvaluationResponse = {
  evaluation_id: 'eval-001',
  status: 'success',
  elapsed_ms: 8420,
  assistive_notice: '本结果仅用于辅助诊断质量评估，不替代医生临床判断。',
  basis_completeness: {
    verdict: 'incomplete',
    summary: '现病史与辅助检查依据仍需补充。',
    missing_items: ['补充症状持续时间', '补录超声检查结果'],
  },
  potential_missing_diagnoses: [
    {
      disease_name: '先兆流产',
      confidence_label: 'medium',
      rationale: '当前病历尚未说明腹痛和阴道流血排查情况。',
    },
  ],
  rationale: ['已记录主诉和初步诊断。', '缺少支撑当前诊断的关键辅助检查。'],
  suggestions: ['补充现病史关键时间线。', '补录已完成的超声结果。'],
};

describe('DoctorEvaluationPanel', () => {
  it('renders the initial shell and trigger action', () => {
    render(<DoctorEvaluationPanel encounter={encounterFixture} onRunEvaluation={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '诊鉴' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '诊鉴' })).toBeInTheDocument();
    expect(screen.getByText('等待触发后返回结构化辅助评估')).toBeInTheDocument();
  });

  it('disables duplicate submission while loading and sends the normalized request', async () => {
    let resolveRequest: ((value: RealtimeEvaluationResponse) => void) | undefined;
    const onRunEvaluation = vi.fn(
      () =>
        new Promise<RealtimeEvaluationResponse>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(<DoctorEvaluationPanel encounter={encounterFixture} onRunEvaluation={onRunEvaluation} />);

    fireEvent.click(screen.getByRole('button', { name: '诊鉴' }));

    expect(onRunEvaluation).toHaveBeenCalledWith({
      encounter_id: 'enc-1001',
      case_id: 'case-2002',
      patient_id: 'patient-3003',
      triggered_by_doctor_id: 'doctor-4004',
      encounter_snapshot: {
        chief_complaint: '停经 7 周，伴轻度恶心。',
        history_of_present_illness: '近 3 天晨起恶心，无腹痛。',
        physical_exam: '腹软无压痛。',
        auxiliary_exam: '尿妊娠试验阳性。',
        diagnoses: [{ disease_code: undefined, disease_name: '早孕待查', is_primary: true }],
      },
    });
    expect(screen.getByRole('button', { name: '诊鉴' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: '诊鉴进行中' })).toBeInTheDocument();

    resolveRequest?.(successResponse);

    expect(await screen.findByRole('heading', { name: '辅助评估结果' })).toBeInTheDocument();
  });

  it('renders the structured success result', async () => {
    const onRunEvaluation = vi.fn().mockResolvedValue(successResponse);

    render(<DoctorEvaluationPanel encounter={encounterFixture} onRunEvaluation={onRunEvaluation} />);

    fireEvent.click(screen.getByRole('button', { name: '诊鉴' }));

    expect(await screen.findByText('现病史与辅助检查依据仍需补充。')).toBeInTheDocument();
    expect(screen.getByText(/先兆流产 · medium/)).toBeInTheDocument();
    expect(screen.getByText('补充现病史关键时间线。')).toBeInTheDocument();
    expect(screen.getByText('本结果仅用于辅助诊断质量评估，不替代医生临床判断。')).toBeInTheDocument();
  });

  it('renders the timeout state from the injected callback', async () => {
    const onRunEvaluation = vi.fn().mockResolvedValue({
      ...successResponse,
      status: 'timeout',
      elapsed_ms: 10000,
      potential_missing_diagnoses: [],
      rationale: [],
      suggestions: [],
    });

    render(<DoctorEvaluationPanel encounter={encounterFixture} onRunEvaluation={onRunEvaluation} />);

    fireEvent.click(screen.getByRole('button', { name: '诊鉴' }));

    expect(await screen.findByRole('heading', { name: '诊鉴响应超时' })).toBeInTheDocument();
    expect(screen.getByText('本次诊鉴在时限内未返回完整结果，请医生决定是否稍后重试。')).toBeInTheDocument();
  });

  it('renders the failed state from a normalized backend payload', async () => {
    const onRunEvaluation = vi.fn().mockResolvedValue({
      ...successResponse,
      status: 'failed',
      elapsed_ms: 1300,
      basis_completeness: {
        verdict: 'incomplete',
        summary: '本次诊鉴执行失败，暂未生成可供参考的结构化评估结果。',
        missing_items: [],
      },
      potential_missing_diagnoses: [],
      rationale: [],
      suggestions: ['请核对病历内容后重试，如仍失败请联系支持人员。'],
    });

    render(<DoctorEvaluationPanel encounter={encounterFixture} onRunEvaluation={onRunEvaluation} />);

    fireEvent.click(screen.getByRole('button', { name: '诊鉴' }));

    expect(await screen.findByRole('heading', { name: '诊鉴执行失败' })).toBeInTheDocument();
    expect(screen.getByText('本次诊鉴未能完成，请核对病历内容后再试。')).toBeInTheDocument();
  });

  it('renders the error state when the callback rejects', async () => {
    const onRunEvaluation = vi.fn().mockRejectedValue(new Error('boom'));

    render(<DoctorEvaluationPanel encounter={encounterFixture} onRunEvaluation={onRunEvaluation} />);

    fireEvent.click(screen.getByRole('button', { name: '诊鉴' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '诊鉴执行失败' })).toBeInTheDocument();
    });
  });
});
