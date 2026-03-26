import { describe, expect, it } from 'vitest';

import { buildDistributionChartOption } from '../distribution-chart-options';

describe('buildDistributionChartOption', () => {
  it('maps department rows into scatter bubbles with tooltip metrics', () => {
    const option = buildDistributionChartOption([
      {
        department_id: 'dept-ob',
        department_name: '产科门诊',
        department_type_id: 'dept-type-ob',
        department_type_name: '妇产门诊',
        outpatient_count: 120,
        success_evaluated_count: 20,
        diagnosis_basis_incomplete_rate_by_success: 0.1,
        missing_diagnosis_rate_by_success: 0.2,
      },
    ]);

    expect(option.series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'scatter',
          symbolSize: expect.any(Function),
        }),
      ]),
    );
    expect(JSON.stringify(option)).toContain('门诊量');
    expect(JSON.stringify(option)).toContain('诊断依据不完整比例');
  });
});
