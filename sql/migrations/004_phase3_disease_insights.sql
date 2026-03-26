create or replace function analytics.get_disease_insights(
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
  "diseaseId" text,
  "diseaseName" text,
  "issueCount" bigint,
  "diagnosisBasisIncompleteCount" bigint,
  "missingDiagnosisCount" bigint,
  "severityRatio" numeric,
  "severityBand" text
)
language sql
as $$
  with resolved as (
    select *
    from analytics.resolve_time_window(range_key, as_of_date, custom_start, custom_end)
  ),
  filtered as (
    select
      encounter.disease_id,
      coalesce(case_row.diagnosis_basis_incomplete, false) as diagnosis_basis_incomplete,
      coalesce(case_row.missing_diagnosis, false) as missing_diagnosis
    from analytics.fact_outpatient_encounter encounter
    join analytics.mart_case_evaluation case_row
      on case_row.encounter_id = encounter.encounter_id
    cross join resolved
    where (encounter.encounter_at at time zone 'Asia/Shanghai')::date
      between resolved.range_start_date and resolved.range_end_date
      and case_row.was_successfully_evaluated
      and (coalesce(cardinality("departmentIds"), 0) = 0 or encounter.department_id = any("departmentIds"))
      and (coalesce(cardinality("departmentTypeIds"), 0) = 0 or encounter.department_type_id = any("departmentTypeIds"))
      and (coalesce(cardinality("doctorIds"), 0) = 0 or encounter.doctor_id = any("doctorIds"))
      and (coalesce(cardinality("diseaseIds"), 0) = 0 or encounter.disease_id = any("diseaseIds"))
  ),
  aggregated as (
    select
      disease.disease_id,
      disease.disease_name,
      count(*) filter (where filtered.diagnosis_basis_incomplete)::bigint as diagnosis_basis_incomplete_count,
      count(*) filter (where filtered.missing_diagnosis)::bigint as missing_diagnosis_count,
      (
        count(*) filter (where filtered.diagnosis_basis_incomplete)
        + count(*) filter (where filtered.missing_diagnosis)
      )::bigint as issue_count
    from filtered
    join analytics.dim_disease disease
      on disease.disease_id = filtered.disease_id
    group by disease.disease_id, disease.disease_name
    having (
      count(*) filter (where filtered.diagnosis_basis_incomplete)
      + count(*) filter (where filtered.missing_diagnosis)
    ) > 0
  ),
  ranked as (
    select
      aggregated.*,
      row_number() over (
        order by
          aggregated.issue_count desc,
          aggregated.missing_diagnosis_count desc,
          aggregated.diagnosis_basis_incomplete_count desc,
          aggregated.disease_name asc
      ) as disease_rank,
      count(*) over () as disease_count,
      max(aggregated.issue_count) over () as max_issue_count
    from aggregated
  )
  select
    ranked.disease_id as "diseaseId",
    ranked.disease_name as "diseaseName",
    ranked.issue_count as "issueCount",
    ranked.diagnosis_basis_incomplete_count as "diagnosisBasisIncompleteCount",
    ranked.missing_diagnosis_count as "missingDiagnosisCount",
    case
      when ranked.max_issue_count = 0 then 0
      else round(ranked.issue_count::numeric / ranked.max_issue_count, 4)
    end as "severityRatio",
    case
      when ((ranked.disease_rank - 1)::numeric / ranked.disease_count) < 0.2 then 'top_20'
      when ((ranked.disease_rank - 1)::numeric / ranked.disease_count) < 0.5 then 'top_50'
      when ((ranked.disease_rank - 1)::numeric / ranked.disease_count) < 0.7 then 'top_70'
      else 'tail'
    end as "severityBand"
  from ranked
  order by ranked.disease_rank
  limit 20;
$$;
