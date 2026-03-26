import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface DiagnosisTrendChartProps {
  option: EChartsOption;
}

export function DiagnosisTrendChart({ option }: DiagnosisTrendChartProps) {
  return <ReactECharts option={option} style={{ width: '100%', minHeight: '360px' }} className="trend-chart" />;
}
