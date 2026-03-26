export interface DistributionFiltersPayload {
  as_of_date: string;
  range_key: string;
  start_date: string | null;
  end_date: string | null;
  department_ids: string[] | null;
  department_type_ids: string[] | null;
  doctor_ids: string[] | null;
  disease_ids: string[] | null;
}

export interface DepartmentTypeOptionPayload {
  department_type_id: string;
  department_type_name: string;
}

export interface DepartmentDistributionRowPayload {
  department_id: string;
  department_name: string;
  department_type_id: string;
  department_type_name: string;
  outpatient_count: number;
  success_evaluated_count: number;
  diagnosis_basis_incomplete_rate_by_success: number | null;
  missing_diagnosis_rate_by_success: number | null;
}

export interface DepartmentDistributionResponse {
  filters: DistributionFiltersPayload;
  available_department_types: DepartmentTypeOptionPayload[];
  rows: DepartmentDistributionRowPayload[];
}
