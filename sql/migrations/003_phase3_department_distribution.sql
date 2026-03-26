create or replace function analytics.get_department_distribution(
  range_key text,
  as_of_date date,
  custom_start date default null,
  custom_end date default null,
  "departmentIds" text[] default null,
  "departmentTypeIds" text[] default null,
  "doctorIds" text[] default null,
  "diseaseIds" text[] default null
)
returns table (
  "departmentId" text,
  "departmentName" text,
  "departmentTypeId" text,
  "departmentTypeName" text,
  "outpatientCount" bigint,
  "successEvaluatedCount" bigint,
  "diagnosisBasisIncompleteRateBySuccess" numeric,
  "missingDiagnosisRateBySuccess" numeric
)
language sql
as $$
  with resolved as (
    select *
    from analytics.resolve_time_window(range_key, as_of_date, custom_start, custom_end)
  ),
  filtered as (
    select
      encounter.department_id,
      encounter.department_type_id,
      case_row.was_successfully_evaluated,
      coalesce(case_row.diagnosis_basis_incomplete, false) as diagnosis_basis_incomplete,
      coalesce(case_row.missing_diagnosis, false) as missing_diagnosis
    from analytics.fact_outpatient_encounter encounter
    join analytics.mart_case_evaluation case_row
      on case_row.encounter_id = encounter.encounter_id
    cross join resolved
    where (encounter.encounter_at at time zone 'Asia/Shanghai')::date
      between resolved.range_start_date and resolved.range_end_date
      and (coalesce(cardinality("departmentIds"), 0) = 0 or encounter.department_id = any("departmentIds"))
      and (coalesce(cardinality("departmentTypeIds"), 0) = 0 or encounter.department_type_id = any("departmentTypeIds"))
      and (coalesce(cardinality("doctorIds"), 0) = 0 or encounter.doctor_id = any("doctorIds"))
      and (coalesce(cardinality("diseaseIds"), 0) = 0 or encounter.disease_id = any("diseaseIds"))
  )
  select
    dept.department_id as "departmentId",
    dept.department_name as "departmentName",
    dept.department_type_id as "departmentTypeId",
    dept_type.department_type_name as "departmentTypeName",
    count(*)::bigint as "outpatientCount",
    count(*) filter (where filtered.was_successfully_evaluated)::bigint as "successEvaluatedCount",
    case
      when count(*) filter (where filtered.was_successfully_evaluated) = 0 then null
      else round(
        (count(*) filter (
          where filtered.was_successfully_evaluated and filtered.diagnosis_basis_incomplete
        ))::numeric / (count(*) filter (where filtered.was_successfully_evaluated)),
        4
      )
    end as "diagnosisBasisIncompleteRateBySuccess",
    case
      when count(*) filter (where filtered.was_successfully_evaluated) = 0 then null
      else round(
        (count(*) filter (
          where filtered.was_successfully_evaluated and filtered.missing_diagnosis
        ))::numeric / (count(*) filter (where filtered.was_successfully_evaluated)),
        4
      )
    end as "missingDiagnosisRateBySuccess"
  from filtered
  join analytics.dim_department dept
    on dept.department_id = filtered.department_id
  join analytics.dim_department_type dept_type
    on dept_type.department_type_id = filtered.department_type_id
  group by
    dept.department_id,
    dept.department_name,
    dept.department_type_id,
    dept_type.department_type_name
  order by "outpatientCount" desc, "departmentName" asc;
$$;
