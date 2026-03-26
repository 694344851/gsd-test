export type DiseaseSeverityBand = 'top_20' | 'top_50' | 'top_70' | 'tail';

export interface DiseaseInsightsFiltersPayload {
  as_of_date: string;
  range_key: string;
  start_date: string | null;
  end_date: string | null;
  department_ids: string[] | null;
  department_type_ids: string[] | null;
  doctor_ids: string[] | null;
  disease_ids: string[] | null;
}

export interface DiseaseInsightRowPayload {
  disease_id: string;
  disease_name: string;
  issue_count: number;
  diagnosis_basis_incomplete_count: number;
  missing_diagnosis_count: number;
  severity_ratio: number;
  severity_band: DiseaseSeverityBand;
}

export interface DiseaseInsightsResponse {
  filters: DiseaseInsightsFiltersPayload;
  rows: DiseaseInsightRowPayload[];
}
