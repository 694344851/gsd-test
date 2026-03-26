import { describe, expect, it } from 'vitest';

import { buildDiseaseCloudLayout, getRingForSeverityBand, getSeverityColor } from '../disease-cloud-layout';

describe('disease cloud layout', () => {
  it('maps severity bands from center outward with darker colors for higher severity', () => {
    expect(getRingForSeverityBand('top_20')).toBe('center_ring');
    expect(getRingForSeverityBand('top_50')).toBe('inner_ring');
    expect(getRingForSeverityBand('top_70')).toBe('mid_ring');
    expect(getRingForSeverityBand('tail')).toBe('outer_ring');
    expect(getSeverityColor('top_20')).toBe('#0F3C96');
    expect(getSeverityColor('tail')).toBe('#C4D7FF');
  });

  it('preserves ranked order while assigning deterministic positions', () => {
    const layout = buildDiseaseCloudLayout([
      {
        disease_id: 'disease-c',
        disease_name: '疾病C',
        issue_count: 4,
        diagnosis_basis_incomplete_count: 2,
        missing_diagnosis_count: 2,
        severity_ratio: 1,
        severity_band: 'top_20',
      },
      {
        disease_id: 'disease-d',
        disease_name: '疾病D',
        issue_count: 2,
        diagnosis_basis_incomplete_count: 1,
        missing_diagnosis_count: 1,
        severity_ratio: 0.5,
        severity_band: 'top_50',
      },
      {
        disease_id: 'disease-e',
        disease_name: '疾病E',
        issue_count: 1,
        diagnosis_basis_incomplete_count: 1,
        missing_diagnosis_count: 0,
        severity_ratio: 0.25,
        severity_band: 'top_70',
      },
      {
        disease_id: 'disease-f',
        disease_name: '疾病F',
        issue_count: 1,
        diagnosis_basis_incomplete_count: 0,
        missing_diagnosis_count: 1,
        severity_ratio: 0.25,
        severity_band: 'tail',
      },
    ]);

    expect(layout.map((item) => item.diseaseName)).toEqual(['疾病C', '疾病D', '疾病E', '疾病F']);
    expect(layout.map((item) => item.ring)).toEqual(['center_ring', 'inner_ring', 'mid_ring', 'outer_ring']);
    expect(layout[0]).toMatchObject({ left: '50%', top: '50%' });
  });
});
