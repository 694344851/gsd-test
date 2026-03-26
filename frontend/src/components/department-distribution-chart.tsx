import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface DepartmentDistributionChartProps {
  option: EChartsOption;
}

export function DepartmentDistributionChart({ option }: DepartmentDistributionChartProps) {
  return <ReactECharts option={option} style={{ width: '100%', minHeight: '420px' }} />;
}
