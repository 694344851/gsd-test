import type { DashboardFilters } from './analytics-filters';
import type { OverviewResponse } from './overview-contracts';

function appendList(params: URLSearchParams, key: string, values?: string[]): void {
  values?.forEach((value) => params.append(key, value));
}

function buildOverviewQuery(filters: DashboardFilters): URLSearchParams {
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

export async function loadOverview(filters: DashboardFilters): Promise<OverviewResponse> {
  const response = await fetch(`/api/analytics/overview?${buildOverviewQuery(filters).toString()}`);
  if (!response.ok) {
    throw new Error(`overview request failed: ${response.status}`);
  }
  const payload = (await response.json()) as OverviewResponse;
  return {
    ...payload,
    previous_summary: payload.previous_summary,
  };
}
