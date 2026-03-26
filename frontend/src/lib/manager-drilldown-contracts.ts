import { getRangeLabel, type DashboardFilters, type DashboardRangeKey } from './analytics-filters';

export type DrilldownDimension = 'department' | 'doctor' | 'disease';
export type DrilldownSourceModule = 'distribution' | 'disease_insights' | 'overview';

export interface DrilldownIntent {
  dimension: DrilldownDimension;
  dimension_value: string;
  dimension_label: string;
  source_module: DrilldownSourceModule;
  filters: DashboardFilters;
}

export interface ProblemCaseRow {
  encounter_id: string;
  patient_name: string;
  department_name: string;
  doctor_name: string;
  primary_diagnosis_name: string;
  evaluation_status: 'success' | 'timeout' | 'failed';
  diagnosis_basis_incomplete: boolean;
  missing_diagnosis: boolean;
  triggered_at: string;
}

export interface ManagerDrilldownSummary {
  total_case_count: number;
  diagnosis_basis_incomplete_count: number;
  missing_diagnosis_count: number;
}

export interface ManagerDrilldownRequest extends DrilldownIntent {}

export interface ManagerDrilldownResponse {
  request: ManagerDrilldownRequest;
  summary: ManagerDrilldownSummary;
  rows: ProblemCaseRow[];
}

function appendList(params: URLSearchParams, key: string, values?: string[]): void {
  values?.forEach((value) => params.append(key, value));
}

function getOptionalList(params: URLSearchParams, key: string): string[] | undefined {
  const values = params.getAll(key).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function isRangeKey(value: string): value is DashboardRangeKey {
  return [
    'last_3_months',
    'last_6_months',
    'last_12_months',
    'last_30_days',
    'last_7_days',
    'previous_week',
    'previous_month',
    'previous_quarter',
    'previous_year',
    'custom',
  ].includes(value);
}

function isDimension(value: string | null): value is DrilldownDimension {
  return value === 'department' || value === 'doctor' || value === 'disease';
}

function isSourceModule(value: string | null): value is DrilldownSourceModule {
  return value === 'distribution' || value === 'disease_insights' || value === 'overview';
}

export function serializeDashboardFilters(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set('as_of_date', filters.asOfDate);
  params.set('range_key', filters.rangeKey);
  if (filters.startDate) {
    params.set('start_date', filters.startDate);
  }
  if (filters.endDate) {
    params.set('end_date', filters.endDate);
  }
  appendList(params, 'department_ids', filters.departmentIds);
  appendList(params, 'department_type_ids', filters.departmentTypeIds);
  appendList(params, 'doctor_ids', filters.doctorIds);
  appendList(params, 'disease_ids', filters.diseaseIds);
  return params;
}

export function parseDashboardFilters(params: URLSearchParams): DashboardFilters | null {
  const asOfDate = params.get('as_of_date');
  const rangeKey = params.get('range_key');
  if (!asOfDate || !rangeKey || !isRangeKey(rangeKey)) {
    return null;
  }

  const filters: DashboardFilters = {
    asOfDate,
    rangeKey,
  };

  const startDate = params.get('start_date');
  const endDate = params.get('end_date');
  if (startDate) {
    filters.startDate = startDate;
  }
  if (endDate) {
    filters.endDate = endDate;
  }

  const departmentIds = getOptionalList(params, 'department_ids');
  const departmentTypeIds = getOptionalList(params, 'department_type_ids');
  const doctorIds = getOptionalList(params, 'doctor_ids');
  const diseaseIds = getOptionalList(params, 'disease_ids');

  if (departmentIds) {
    filters.departmentIds = departmentIds;
  }
  if (departmentTypeIds) {
    filters.departmentTypeIds = departmentTypeIds;
  }
  if (doctorIds) {
    filters.doctorIds = doctorIds;
  }
  if (diseaseIds) {
    filters.diseaseIds = diseaseIds;
  }

  return filters;
}

export function buildDrilldownSearch(intent: DrilldownIntent): string {
  const params = serializeDashboardFilters(intent.filters);
  params.set('view', 'manager-drilldown');
  params.set('dimension', intent.dimension);
  params.set('dimension_value', intent.dimension_value);
  params.set('dimension_label', intent.dimension_label);
  params.set('source_module', intent.source_module);
  return `?${params.toString()}`;
}

export function parseDrilldownIntent(params: URLSearchParams): DrilldownIntent | null {
  const filters = parseDashboardFilters(params);
  const dimension = params.get('dimension');
  const dimensionValue = params.get('dimension_value');
  const dimensionLabel = params.get('dimension_label');
  const sourceModule = params.get('source_module');

  if (!filters || !isDimension(dimension) || !dimensionValue || !dimensionLabel || !isSourceModule(sourceModule)) {
    return null;
  }

  return {
    dimension,
    dimension_value: dimensionValue,
    dimension_label: dimensionLabel,
    source_module: sourceModule,
    filters,
  };
}

export function formatFiltersSummary(filters: DashboardFilters): string {
  const parts = [`时间 ${getRangeLabel(filters.rangeKey)}`, `截止 ${filters.asOfDate}`];
  if (filters.startDate && filters.endDate) {
    parts.push(`区间 ${filters.startDate} 至 ${filters.endDate}`);
  }
  if (filters.departmentTypeIds?.length) {
    parts.push(`科室类型 ${filters.departmentTypeIds.join('、')}`);
  }
  if (filters.departmentIds?.length) {
    parts.push(`科室 ${filters.departmentIds.join('、')}`);
  }
  if (filters.doctorIds?.length) {
    parts.push(`医生 ${filters.doctorIds.join('、')}`);
  }
  if (filters.diseaseIds?.length) {
    parts.push(`病种 ${filters.diseaseIds.join('、')}`);
  }
  return parts.join(' · ');
}
