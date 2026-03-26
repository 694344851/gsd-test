import { useState } from 'react';

import { downloadProblemCases } from '../lib/export-api';
import type { ManagerDrilldownRequest } from '../lib/manager-drilldown-contracts';

export interface ExportCasesButtonProps {
  request: ManagerDrilldownRequest;
}

export function ExportCasesButton({ request }: ExportCasesButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleExport = async () => {
    setStatus('loading');
    try {
      const result = await downloadProblemCases(request);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="export-cases">
      <button className="dashboard-page__back" type="button" disabled={status === 'loading'} onClick={() => void handleExport()}>
        {status === 'loading' ? '导出中...' : '导出问题病例'}
      </button>
      {status === 'error' ? <p className="dashboard-panel__body">导出失败，请稍后重试。</p> : null}
    </div>
  );
}
