import type { ProblemCaseRow } from '../lib/manager-drilldown-contracts';

export interface ProblemCaseTableProps {
  rows: ProblemCaseRow[];
}

function formatStatus(value: ProblemCaseRow['evaluation_status']): string {
  if (value === 'success') {
    return '成功';
  }
  if (value === 'timeout') {
    return '超时';
  }
  return '失败';
}

export function ProblemCaseTable({ rows }: ProblemCaseTableProps) {
  return (
    <div className="problem-case-table" data-testid="problem-case-table">
      <table>
        <thead>
          <tr>
            <th scope="col">就诊号</th>
            <th scope="col">患者</th>
            <th scope="col">科室</th>
            <th scope="col">医生</th>
            <th scope="col">主诊断</th>
            <th scope="col">结果</th>
            <th scope="col">依据不完整</th>
            <th scope="col">缺漏诊断</th>
            <th scope="col">触发时间</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.encounter_id}>
              <td>{row.encounter_id}</td>
              <td>{row.patient_name}</td>
              <td>{row.department_name}</td>
              <td>{row.doctor_name}</td>
              <td>{row.primary_diagnosis_name}</td>
              <td>{formatStatus(row.evaluation_status)}</td>
              <td>{row.diagnosis_basis_incomplete ? '是' : '否'}</td>
              <td>{row.missing_diagnosis ? '是' : '否'}</td>
              <td>{row.triggered_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
