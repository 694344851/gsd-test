import React from 'react';
import ReactDOM from 'react-dom/client';

import { DoctorEvaluationPage, type DoctorEvaluationPageProps } from '../app/doctor-evaluation-page';
import '../styles/dashboard.css';

export interface DoctorEvaluationEmbedHandle {
  unmount: () => void;
  update: (props: DoctorEvaluationPageProps) => void;
}

export function mountDoctorEvaluationEmbed(
  container: Element,
  props: DoctorEvaluationPageProps,
): DoctorEvaluationEmbedHandle {
  const root = ReactDOM.createRoot(container);

  const render = (nextProps: DoctorEvaluationPageProps) => {
    root.render(
      <React.StrictMode>
        <DoctorEvaluationPage {...nextProps} />
      </React.StrictMode>,
    );
  };

  render(props);

  return {
    unmount: () => root.unmount(),
    update: (nextProps) => render(nextProps),
  };
}
