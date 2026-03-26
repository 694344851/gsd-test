import type { DashboardFilters } from './analytics-filters';
import type { DiseaseInsightsResponse } from './disease-insights-contracts';

function appendList(params: URLSearchParams, key: string, values?: string[]): void {
  values?.forEach((value) => params.append(key, value));
}

function buildDiseaseInsightsQuery(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set('range_key', filters.rangeKey);
  params.set('as_of_date', filters.asOfDate);
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

export async function loadDiseaseInsights(filters: DashboardFilters): Promise<DiseaseInsightsResponse> {
  const response = await fetch(`/api/analytics/disease-insights?${buildDiseaseInsightsQuery(filters).toString()}`);
  if (!response.ok) {
    throw new Error(`disease insights request failed: ${response.status}`);
  }
  return (await response.json()) as DiseaseInsightsResponse;
}
