import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DoctorEvaluationPage } from '../doctor-evaluation-page';
import type { EmrEncounterContext } from '../../lib/emr-encounter-contracts';

const encounterFixture: EmrEncounterContext = {
  encounter_id: 'enc-1001',
  case_id: 'case-2002',
  patient: {
    patient_id: 'patient-3003',
    patient_name: '王小林',
    gender: '女',
    age: 32,
  },
  doctor: {
    doctor_id: 'doctor-4004',
    doctor_name: '张医生',
    department_name: '妇科门诊',
    title: '主治医师',
  },
  sections: {
    chief_complaint: '停经 7 周，伴轻度恶心 3 天。',
    history_of_present_illness: '近 3 天晨起恶心，无腹痛及阴道流血。',
    physical_exam: '生命体征平稳，腹软无压痛。',
    auxiliary_exam: '尿妊娠试验阳性。',
  },
  diagnoses: [
    {
      disease_code: 'O09.9',
      disease_name: '早孕待查',
      is_primary: true,
    },
  ],
};

describe('DoctorEvaluationPage', () => {
  it('renders doctor-side encounter context and keeps the trigger entry visible', () => {
    render(<DoctorEvaluationPage encounter={encounterFixture} />);

    expect(screen.getByRole('heading', { name: '门诊实时诊鉴' })).toBeInTheDocument();
    expect(screen.getByText('王小林')).toBeInTheDocument();
    expect(screen.getByText(/病历号 case-2002 · 就诊号 enc-1001/)).toBeInTheDocument();
    expect(screen.getByText('早孕待查')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '诊鉴' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '等待触发后返回结构化辅助评估' })).toBeInTheDocument();
  });
});
