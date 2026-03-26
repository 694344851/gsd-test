import type {
  ManagerDrilldownRequest,
  ManagerDrilldownResponse,
  ProblemCaseRow,
} from './manager-drilldown-contracts';
import { serializeDashboardFilters } from './manager-drilldown-contracts';
import { createManagerViewerContext } from './viewer-context-contracts';

function buildSeedRows(request: ManagerDrilldownRequest): ProblemCaseRow[] {
  return [
    {
      encounter_id: `${request.dimension}-encounter-001`,
      patient_name: '王丽',
      department_name: request.dimension === 'department' ? request.dimension_label : '心内科',
      doctor_name: request.dimension === 'doctor' ? request.dimension_label : '张晓明',
      primary_diagnosis_name: request.dimension === 'disease' ? request.dimension_label : '高血压',
      evaluation_status: 'success',
      diagnosis_basis_incomplete: true,
      missing_diagnosis: false,
      triggered_at: '2026-03-24T09:12:00+08:00',
    },
    {
      encounter_id: `${request.dimension}-encounter-002`,
      patient_name: '李敏',
      department_name: request.dimension === 'department' ? request.dimension_label : '全科门诊',
      doctor_name: request.dimension === 'doctor' ? request.dimension_label : '陈海波',
      primary_diagnosis_name: request.dimension === 'disease' ? request.dimension_label : '糖尿病',
      evaluation_status: 'failed',
      diagnosis_basis_incomplete: true,
      missing_diagnosis: true,
      triggered_at: '2026-03-23T15:30:00+08:00',
    },
  ];
}

export function buildManagerDrilldownSeedResponse(
  request: ManagerDrilldownRequest,
): ManagerDrilldownResponse {
  const rows = buildSeedRows(request);

  return {
    request,
    summary: {
      total_case_count: rows.length,
      diagnosis_basis_incomplete_count: rows.filter((row) => row.diagnosis_basis_incomplete).length,
      missing_diagnosis_count: rows.filter((row) => row.missing_diagnosis).length,
    },
    rows,
  };
}

export async function loadManagerDrilldown(
  request: ManagerDrilldownRequest,
): Promise<ManagerDrilldownResponse> {
  const params = serializeDashboardFilters(request.filters);
  params.set('dimension', request.dimension);
  params.set('dimension_value', request.dimension_value);
  params.set('dimension_label', request.dimension_label);
  params.set('source_module', request.source_module);

  const viewer = createManagerViewerContext();
  const response = await fetch(`/api/problem-drilldown?${params.toString()}`, {
    headers: {
      'X-Viewer-Role': viewer.viewer_role,
      'X-Viewer-Id': viewer.viewer_id ?? 'manager-ui',
    },
  });
  if (!response.ok) {
    throw new Error(`problem drilldown request failed: ${response.status}`);
  }
  return (await response.json()) as ManagerDrilldownResponse;
}
