import type { ManagerDrilldownRequest } from './manager-drilldown-contracts';
import { serializeDashboardFilters } from './manager-drilldown-contracts';
import { createManagerViewerContext } from './viewer-context-contracts';

export interface ProblemCaseExportResult {
  blob: Blob;
  filename: string;
}

function resolveFilename(response: Response): string {
  const disposition = response.headers.get('Content-Disposition');
  const matched = disposition?.match(/filename="?([^"]+)"?/);
  return matched?.[1] ?? 'problem-cases.csv';
}

export async function downloadProblemCases(
  request: ManagerDrilldownRequest,
): Promise<ProblemCaseExportResult> {
  const params = serializeDashboardFilters(request.filters);
  params.set('dimension', request.dimension);
  params.set('dimension_value', request.dimension_value);
  params.set('dimension_label', request.dimension_label);
  params.set('source_module', request.source_module);

  const viewer = createManagerViewerContext();
  const response = await fetch(`/api/problem-cases/export?${params.toString()}`, {
    headers: {
      'X-Viewer-Role': viewer.viewer_role,
      'X-Viewer-Id': viewer.viewer_id ?? 'manager-ui',
    },
  });
  if (!response.ok) {
    throw new Error(`problem case export failed: ${response.status}`);
  }

  return {
    blob: await response.blob(),
    filename: resolveFilename(response),
  };
}
