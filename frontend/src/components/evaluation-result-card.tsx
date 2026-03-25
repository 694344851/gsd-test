import type { ReactNode } from 'react';

export interface EvaluationResultCardProps {
  title: string;
  children: ReactNode;
}

export function EvaluationResultCard({ title, children }: EvaluationResultCardProps) {
  return (
    <article className="overview-card">
      <h3 className="overview-card__label">{title}</h3>
      <div className="dashboard-panel__body">{children}</div>
    </article>
  );
}
