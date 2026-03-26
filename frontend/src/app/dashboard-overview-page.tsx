import { useEffect, useMemo, useState } from 'react';

import { DiseaseInsightsSection } from '../components/disease-insights-section';
import { DistributionSection } from '../components/distribution-section';
import { OverviewSection } from '../components/overview-section';
import { TimeRangeToolbar } from '../components/time-range-toolbar';
import { TrendSection } from '../components/trend-section';
import { loadManagerDrilldown } from '../lib/manager-drilldown-api';
import { createDefaultDashboardFilters, type DashboardFilters } from '../lib/analytics-filters';
import { buildDrilldownSearch, type DrilldownIntent } from '../lib/manager-drilldown-contracts';
import { createManagerViewerContext, type ViewerContext } from '../lib/viewer-context-contracts';
import { ManagerDrilldownPage } from './manager-drilldown-page';

interface DashboardOverviewPageProps {
  now?: Date;
  locationSearch?: string;
  onNavigateToSearch?: (search: string) => void;
  onLoadDrilldown?: typeof loadManagerDrilldown;
  viewerContext?: ViewerContext;
}

export function DashboardOverviewPage({
  now,
  locationSearch,
  onNavigateToSearch,
  onLoadDrilldown = loadManagerDrilldown,
  viewerContext = createManagerViewerContext(),
}: DashboardOverviewPageProps) {
  const [filters, setFilters] = useState<DashboardFilters>(() => createDefaultDashboardFilters(now));
  const [liveSearch, setLiveSearch] = useState<string>(() => locationSearch ?? window.location.search);

  useEffect(() => {
    if (locationSearch !== undefined) {
      setLiveSearch(locationSearch);
      return;
    }

    const sync = () => {
      setLiveSearch(window.location.search);
    };

    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('popstate', sync);
    };
  }, [locationSearch]);

  const search = locationSearch ?? liveSearch;
  const isDrilldownView = useMemo(() => new URLSearchParams(search).get('view') === 'manager-drilldown', [search]);

  const navigateToSearch = (nextSearch: string) => {
    if (onNavigateToSearch) {
      onNavigateToSearch(nextSearch);
      return;
    }

    const normalizedSearch = nextSearch
      ? nextSearch.startsWith('?')
        ? nextSearch
        : `?${nextSearch}`
      : window.location.pathname;
    window.history.pushState(null, '', normalizedSearch);
    setLiveSearch(nextSearch ? normalizedSearch : '');
  };

  const handleDrilldown = (intent: DrilldownIntent) => {
    navigateToSearch(buildDrilldownSearch(intent));
  };

  if (isDrilldownView) {
    return (
      <ManagerDrilldownPage
        search={search}
        onBack={() => navigateToSearch('')}
        onLoadDrilldown={onLoadDrilldown}
        viewerContext={viewerContext}
      />
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__hero">
        <p className="dashboard-page__eyebrow">门诊质控总览</p>
        <h1 className="dashboard-page__title">门诊诊鉴管理端首页</h1>
        <p className="dashboard-page__subtitle">聚焦首页首屏摘要带与门诊诊断质量走势。</p>
      </header>
      <TimeRangeToolbar filters={filters} onFiltersChange={setFilters} />
      <div className="dashboard-layout">
        <OverviewSection filters={filters} />
        <TrendSection filters={filters} />
        <DistributionSection
          filters={filters}
          onFiltersChange={setFilters}
          onDrilldown={viewerContext.viewer_role === 'manager' ? handleDrilldown : undefined}
        />
        <DiseaseInsightsSection
          filters={filters}
          onDrilldown={viewerContext.viewer_role === 'manager' ? handleDrilldown : undefined}
        />
      </div>
    </main>
  );
}
