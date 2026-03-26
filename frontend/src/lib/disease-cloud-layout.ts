import type { DiseaseInsightRowPayload, DiseaseSeverityBand } from './disease-insights-contracts';

export type DiseaseCloudRing = 'center_ring' | 'inner_ring' | 'mid_ring' | 'outer_ring';

export interface DiseaseCloudItem {
  diseaseId: string;
  diseaseName: string;
  issueCount: number;
  severityRatio: number;
  severityBand: DiseaseSeverityBand;
  ring: DiseaseCloudRing;
  color: string;
  fontSize: number;
  left: string;
  top: string;
}

const RING_BY_BAND: Record<DiseaseSeverityBand, DiseaseCloudRing> = {
  top_20: 'center_ring',
  top_50: 'inner_ring',
  top_70: 'mid_ring',
  tail: 'outer_ring',
};

const COLOR_BY_BAND: Record<DiseaseSeverityBand, string> = {
  top_20: '#0F3C96',
  top_50: '#2F6BFF',
  top_70: '#78A5FF',
  tail: '#C4D7FF',
};

const POSITIONS: Record<DiseaseCloudRing, Array<{ left: string; top: string }>> = {
  center_ring: [
    { left: '50%', top: '50%' },
    { left: '43%', top: '52%' },
    { left: '57%', top: '48%' },
  ],
  inner_ring: [
    { left: '30%', top: '34%' },
    { left: '68%', top: '34%' },
    { left: '32%', top: '68%' },
    { left: '66%', top: '68%' },
  ],
  mid_ring: [
    { left: '18%', top: '22%' },
    { left: '82%', top: '22%' },
    { left: '18%', top: '78%' },
    { left: '82%', top: '78%' },
  ],
  outer_ring: [
    { left: '12%', top: '50%' },
    { left: '50%', top: '12%' },
    { left: '88%', top: '50%' },
    { left: '50%', top: '88%' },
    { left: '20%', top: '88%' },
    { left: '80%', top: '12%' },
  ],
};

function clampFontSize(size: number): number {
  return Math.max(16, Math.min(34, Math.round(size)));
}

export function getSeverityColor(band: DiseaseSeverityBand): string {
  return COLOR_BY_BAND[band];
}

export function getRingForSeverityBand(band: DiseaseSeverityBand): DiseaseCloudRing {
  return RING_BY_BAND[band];
}

export function buildDiseaseCloudLayout(rows: DiseaseInsightRowPayload[]): DiseaseCloudItem[] {
  const ringIndexes: Record<DiseaseCloudRing, number> = {
    center_ring: 0,
    inner_ring: 0,
    mid_ring: 0,
    outer_ring: 0,
  };

  return rows.map((row, index) => {
    const ring = getRingForSeverityBand(row.severity_band);
    const positionSet = POSITIONS[ring];
    const position = positionSet[ringIndexes[ring] % positionSet.length];
    ringIndexes[ring] += 1;

    return {
      diseaseId: row.disease_id,
      diseaseName: row.disease_name,
      issueCount: row.issue_count,
      severityRatio: row.severity_ratio,
      severityBand: row.severity_band,
      ring,
      color: getSeverityColor(row.severity_band),
      fontSize: clampFontSize(16 + row.severity_ratio * 18 - index * 0.3),
      left: position.left,
      top: position.top,
    };
  });
}
