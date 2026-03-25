export interface RealtimeEvaluationRequestDiagnosis {
  disease_code?: string;
  disease_name: string;
  is_primary: boolean;
}

export interface RealtimeEvaluationRequest {
  encounter_id: string;
  case_id: string;
  patient_id: string;
  triggered_by_doctor_id: string;
  encounter_snapshot: {
    chief_complaint?: string;
    history_of_present_illness?: string;
    physical_exam?: string;
    auxiliary_exam?: string;
    diagnoses: RealtimeEvaluationRequestDiagnosis[];
  };
}

export interface RealtimeEvaluationBasisCompleteness {
  verdict: 'complete' | 'incomplete';
  summary: string;
  missing_items: string[];
}

export interface RealtimeEvaluationPotentialMissingDiagnosis {
  disease_name: string;
  confidence_label: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface RealtimeEvaluationResponse {
  evaluation_id: string;
  status: 'success' | 'timeout' | 'failed';
  elapsed_ms: number;
  assistive_notice: string;
  basis_completeness: RealtimeEvaluationBasisCompleteness;
  potential_missing_diagnoses: RealtimeEvaluationPotentialMissingDiagnosis[];
  rationale: string[];
  suggestions: string[];
}
