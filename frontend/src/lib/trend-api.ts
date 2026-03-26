import type { DashboardFilters } from './analytics-filters';
import type { TrendResponse } from './trend-contracts';

function appendList(params: URLSearchParams, key: string, values?: string[]): void {
  values?.forEach((value) => params.append(key, value));
}

function buildTrendQuery(filters: DashboardFilters): URLSearchParams {
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

export async function loadTrend(filters: DashboardFilters): Promise<TrendResponse> {
  const response = await fetch(`/api/analytics/trend?${buildTrendQuery(filters).toString()}`);
  if (!response.ok) {
    throw new Error(`trend request failed: ${response.status}`);
  }
  return (await response.json()) as TrendResponse;
}
