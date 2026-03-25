export interface EmrEncounterDiagnosis {
  disease_code?: string;
  disease_name: string;
  is_primary: boolean;
}

export interface EmrEncounterSections {
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_exam?: string;
  auxiliary_exam?: string;
}

export interface EmrPatientIdentity {
  patient_id: string;
  patient_name: string;
  gender?: string;
  age?: number;
}

export interface EmrDoctorIdentity {
  doctor_id: string;
  doctor_name: string;
  department_name?: string;
  title?: string;
}

export interface EmrEncounterContext {
  encounter_id: string;
  case_id: string;
  patient: EmrPatientIdentity;
  doctor: EmrDoctorIdentity;
  sections: EmrEncounterSections;
  diagnoses: EmrEncounterDiagnosis[];
  onClosePanel?: () => void;
}
