import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimeRangeToolbar } from '../time-range-toolbar';
import { createDefaultDashboardFilters } from '../../lib/analytics-filters';

afterEach(() => {
  cleanup();
});

describe('TimeRangeToolbar', () => {
  it('switches directly to 过去7天', () => {
    const filters = createDefaultDashboardFilters(new Date('2026-03-25T09:00:00+08:00'));
    const onFiltersChange = vi.fn();

    render(<TimeRangeToolbar filters={filters} onFiltersChange={onFiltersChange} />);

    fireEvent.click(screen.getByRole('button', { name: '过去7天' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      rangeKey: 'last_7_days',
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('applies a custom date range', () => {
    const filters = {
      ...createDefaultDashboardFilters(new Date('2026-03-25T09:00:00+08:00')),
      rangeKey: 'custom' as const,
    };
    const onFiltersChange = vi.fn();

    render(<TimeRangeToolbar filters={filters} onFiltersChange={onFiltersChange} />);

    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2026-02-28' } });
    fireEvent.click(screen.getByRole('button', { name: '应用时间范围' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      rangeKey: 'custom',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
  });
});
