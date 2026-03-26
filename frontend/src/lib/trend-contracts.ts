export interface TrendFiltersPayload {
  as_of_date: string;
  range_key: string;
  start_date: string | null;
  end_date: string | null;
  department_ids: string[] | null;
  department_type_ids: string[] | null;
  doctor_ids: string[] | null;
  disease_ids: string[] | null;
}

export interface TrendSeriesPayload {
  outpatient_count: number;
  unique_patient_outpatient_count: number;
  triggered_evaluation_count: number;
  success_evaluated_count: number;
  diagnosis_basis_incomplete_rate_by_success: number | null;
  diagnosis_basis_incomplete_rate_by_encounter: number | null;
  missing_diagnosis_rate_by_success: number | null;
  missing_diagnosis_rate_by_encounter: number | null;
  range_start_date: string;
  range_end_date: string;
  bucket_grain: 'shift' | 'day' | 'week' | 'month';
  bucket_start: string;
  bucket_end: string;
  bucket_label: string;
}

export interface TrendResponse {
  filters: TrendFiltersPayload;
  series: TrendSeriesPayload[];
}
