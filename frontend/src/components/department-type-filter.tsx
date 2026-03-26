import type { DepartmentTypeOptionPayload } from '../lib/distribution-contracts';

interface DepartmentTypeFilterProps {
  options: DepartmentTypeOptionPayload[];
  value?: string;
  onChange: (value?: string) => void;
}

export function DepartmentTypeFilter({ options, value, onChange }: DepartmentTypeFilterProps) {
  return (
    <div className="department-filter">
      <label htmlFor="department-type-filter">科室类型</label>
      <select
        id="department-type-filter"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">全部科室类型</option>
        {options.map((option) => (
          <option key={option.department_type_id} value={option.department_type_id}>
            {option.department_type_name}
          </option>
        ))}
      </select>
    </div>
  );
}
