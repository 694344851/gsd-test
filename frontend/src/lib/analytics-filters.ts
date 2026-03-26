export type DashboardRangeKey =
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'last_30_days'
  | 'last_7_days'
  | 'previous_week'
  | 'previous_month'
  | 'previous_quarter'
  | 'previous_year'
  | 'custom';

export interface DashboardFilters {
  asOfDate: string;
  rangeKey: DashboardRangeKey;
  startDate?: string;
  endDate?: string;
  departmentIds?: string[];
  departmentTypeIds?: string[];
  doctorIds?: string[];
  diseaseIds?: string[];
}

export interface TimeRangeOption {
  key: DashboardRangeKey;
  label: string;
}

export const timeRangeOptions: TimeRangeOption[] = [
  { key: 'last_3_months', label: '近三个月' },
  { key: 'last_6_months', label: '近半年' },
  { key: 'last_12_months', label: '近一年' },
  { key: 'last_30_days', label: '过去30天' },
  { key: 'last_7_days', label: '过去7天' },
  { key: 'previous_week', label: '上周' },
  { key: 'previous_month', label: '上个月' },
  { key: 'previous_quarter', label: '上个季度' },
  { key: 'previous_year', label: '上一年' },
  { key: 'custom', label: '自定义时间' },
];

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultDashboardFilters(now: Date = new Date()): DashboardFilters {
  const asOf = new Date(now);
  asOf.setDate(asOf.getDate() - 1);

  return {
    asOfDate: formatDate(asOf),
    rangeKey: 'last_3_months',
  };
}

export function getRangeLabel(rangeKey: DashboardRangeKey): string {
  return timeRangeOptions.find((option) => option.key === rangeKey)?.label ?? rangeKey;
}
