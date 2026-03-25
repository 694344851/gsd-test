export type AnalyticsTimeRangeKey =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'previous_week'
  | 'previous_month'
  | 'previous_quarter'
  | 'previous_year'
  | 'custom';

export interface AnalyticsFilters {
  asOfDate: string;
  rangeKey: AnalyticsTimeRangeKey;
  startDate?: string;
  endDate?: string;
  // These arrays map to SQL predicates in the semantic query layer.
  departmentIds?: string[];
  departmentTypeIds?: string[];
  doctorIds?: string[];
  diseaseIds?: string[];
}

export interface OverviewSummaryRow {
  outpatientCount: number;
  uniquePatientOutpatientCount: number;
  triggeredEvaluationCount: number;
  successEvaluatedCount: number;
  diagnosisBasisIncompleteRateBySuccess: number | null;
  diagnosisBasisIncompleteRateByEncounter: number | null;
  missingDiagnosisRateBySuccess: number | null;
  missingDiagnosisRateByEncounter: number | null;
  rangeStartDate: string;
  rangeEndDate: string;
  bucketGrain: 'shift' | 'day' | 'week' | 'month';
}

export interface TrendSeriesRow extends OverviewSummaryRow {
  bucketStart: string;
  bucketEnd: string;
  bucketLabel: string;
}
