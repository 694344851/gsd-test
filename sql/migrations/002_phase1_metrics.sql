create table if not exists analytics.metric_placeholder_config (
  metric_key text primary key,
  is_enabled boolean not null default false,
  placeholder_value numeric
);

insert into analytics.metric_placeholder_config (metric_key, is_enabled, placeholder_value)
values ('quality_index_score', false, null)
on conflict (metric_key) do update
set is_enabled = excluded.is_enabled,
    placeholder_value = excluded.placeholder_value;

create or replace function analytics.resolve_time_window(
  range_key text,
  as_of_date date,
  custom_start date default null,
  custom_end date default null
)
returns table (
  range_start_date date,
  range_end_date date,
  bucket_grain text
)
language plpgsql
as $$
declare
  cutoff_date date := as_of_date - 1;
  span_days integer;
  quarter_start date;
begin
  if range_key is null then
    raise exception 'range_key is required';
  end if;

  if as_of_date is null then
    raise exception 'as_of_date is required';
  end if;

  case range_key
    when 'last_7_days' then
      range_start_date := cutoff_date - 6;
      range_end_date := cutoff_date;
      bucket_grain := 'shift';
    when 'last_30_days' then
      range_start_date := cutoff_date - 29;
      range_end_date := cutoff_date;
      bucket_grain := 'day';
    when 'last_3_months' then
      range_start_date := date_trunc('week', cutoff_date::timestamp)::date - 13 * 7;
      range_end_date := cutoff_date;
      bucket_grain := 'week';
    when 'last_6_months' then
      range_start_date := date_trunc('week', cutoff_date::timestamp)::date - 26 * 7;
      range_end_date := cutoff_date;
      bucket_grain := 'week';
    when 'last_12_months' then
      range_start_date := (date_trunc('month', cutoff_date::timestamp)::date - interval '11 months')::date;
      range_end_date := cutoff_date;
      bucket_grain := 'month';
    when 'previous_week' then
      range_end_date := date_trunc('week', cutoff_date::timestamp)::date - 1;
      range_start_date := range_end_date - 6;
      bucket_grain := 'shift';
    when 'previous_month' then
      range_start_date := (date_trunc('month', cutoff_date::timestamp)::date - interval '1 month')::date;
      range_end_date := date_trunc('month', cutoff_date::timestamp)::date - 1;
      bucket_grain := 'day';
    when 'previous_quarter' then
      quarter_start := make_date(
        extract(year from cutoff_date)::integer,
        ((extract(quarter from cutoff_date)::integer - 1) * 3) + 1,
        1
      );
      range_start_date := (quarter_start - interval '3 months')::date;
      range_end_date := quarter_start - 1;
      bucket_grain := 'week';
    when 'previous_year' then
      range_start_date := make_date(extract(year from cutoff_date)::integer - 1, 1, 1);
      range_end_date := make_date(extract(year from cutoff_date)::integer - 1, 12, 31);
      bucket_grain := 'month';
    when 'custom' then
      if custom_start is null or custom_end is null then
        raise exception 'custom range requires custom_start and custom_end';
      end if;
      if custom_start > custom_end then
        raise exception 'custom_start must be <= custom_end';
      end if;

      range_start_date := custom_start;
      range_end_date := custom_end;
      span_days := custom_end - custom_start + 1;

      if span_days < 30 then
        bucket_grain := 'day';
      elsif span_days < 90 then
        bucket_grain := 'week';
      else
        bucket_grain := 'month';
      end if;
    else
      raise exception 'Unsupported range_key: %', range_key;
  end case;

  return next;
end;
$$;

comment on function analytics.resolve_time_window(text, date, date, date) is
  'Resolves an explicit closed date window from range_key and as_of_date without using current_date.';

create or replace function analytics.get_overview_summary(
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
  "outpatientCount" bigint,
  "uniquePatientOutpatientCount" bigint,
  "triggeredEvaluationCount" bigint,
  "successEvaluatedCount" bigint,
  "diagnosisBasisIncompleteRateBySuccess" numeric,
  "diagnosisBasisIncompleteRateByEncounter" numeric,
  "missingDiagnosisRateBySuccess" numeric,
  "missingDiagnosisRateByEncounter" numeric,
  "rangeStartDate" text,
  "rangeEndDate" text,
  "bucketGrain" text
)
language sql
as $$
  with resolved as (
    select *
    from analytics.resolve_time_window(range_key, as_of_date, custom_start, custom_end)
  ),
  filtered as (
    select
      encounter.encounter_id,
      encounter.patient_id,
      encounter.encounter_at,
      case_row.trigger_count,
      case_row.success_count,
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
  ),
  aggregated as (
    select
      count(*)::bigint as outpatient_count,
      count(distinct patient_id)::bigint as unique_patient_outpatient_count,
      count(*) filter (where trigger_count > 0)::bigint as triggered_evaluation_count,
      count(*) filter (where success_count > 0)::bigint as success_evaluated_count,
      count(*) filter (
        where was_successfully_evaluated and diagnosis_basis_incomplete
      )::numeric as diagnosis_basis_incomplete_cases,
      count(*) filter (
        where was_successfully_evaluated and missing_diagnosis
      )::numeric as missing_diagnosis_cases
    from filtered
  )
  select
    aggregated.outpatient_count as "outpatientCount",
    aggregated.unique_patient_outpatient_count as "uniquePatientOutpatientCount",
    aggregated.triggered_evaluation_count as "triggeredEvaluationCount",
    aggregated.success_evaluated_count as "successEvaluatedCount",
    case
      when aggregated.success_evaluated_count = 0 then null
      else round(aggregated.diagnosis_basis_incomplete_cases / aggregated.success_evaluated_count, 4)
    end as "diagnosisBasisIncompleteRateBySuccess",
    case
      when aggregated.outpatient_count = 0 then null
      else round(aggregated.diagnosis_basis_incomplete_cases / aggregated.outpatient_count, 4)
    end as "diagnosisBasisIncompleteRateByEncounter",
    case
      when aggregated.success_evaluated_count = 0 then null
      else round(aggregated.missing_diagnosis_cases / aggregated.success_evaluated_count, 4)
    end as "missingDiagnosisRateBySuccess",
    case
      when aggregated.outpatient_count = 0 then null
      else round(aggregated.missing_diagnosis_cases / aggregated.outpatient_count, 4)
    end as "missingDiagnosisRateByEncounter",
    to_char(resolved.range_start_date, 'YYYY-MM-DD') as "rangeStartDate",
    to_char(resolved.range_end_date, 'YYYY-MM-DD') as "rangeEndDate",
    resolved.bucket_grain as "bucketGrain"
  from aggregated
  cross join resolved;
$$;

comment on function analytics.get_overview_summary(text, date, date, date, text[], text[], text[], text[]) is
  'Overview semantic query. Homepage/default evaluated-case metric is successEvaluatedCount, while triggeredEvaluationCount remains available separately.';

create or replace function analytics.get_trend_series(
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
  "outpatientCount" bigint,
  "uniquePatientOutpatientCount" bigint,
  "triggeredEvaluationCount" bigint,
  "successEvaluatedCount" bigint,
  "diagnosisBasisIncompleteRateBySuccess" numeric,
  "diagnosisBasisIncompleteRateByEncounter" numeric,
  "missingDiagnosisRateBySuccess" numeric,
  "missingDiagnosisRateByEncounter" numeric,
  "rangeStartDate" text,
  "rangeEndDate" text,
  "bucketGrain" text,
  "bucketStart" text,
  "bucketEnd" text,
  "bucketLabel" text
)
language sql
as $$
  with resolved as (
    select *
    from analytics.resolve_time_window(range_key, as_of_date, custom_start, custom_end)
  ),
  filtered as (
    select
      encounter.encounter_id,
      encounter.patient_id,
      encounter.encounter_at at time zone 'Asia/Shanghai' as encounter_local_at,
      case_row.trigger_count,
      case_row.success_count,
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
  ),
  shift_buckets as (
    select
      (bucket_day + shift_part.start_offset) as bucket_start_at,
      least(bucket_day + shift_part.end_offset, (resolved.range_end_date + 1)::timestamp) as bucket_end_at,
      to_char(bucket_day, 'YYYY-MM-DD') || ' ' || shift_part.label as bucket_label
    from resolved
    cross join generate_series(
      resolved.range_start_date::timestamp,
      resolved.range_end_date::timestamp,
      interval '1 day'
    ) as bucket_day
    cross join (
      values
        (interval '0 hour', interval '12 hour', 'AM'),
        (interval '12 hour', interval '24 hour', 'PM')
    ) as shift_part(start_offset, end_offset, label)
    where resolved.bucket_grain = 'shift'
  ),
  day_buckets as (
    select
      bucket_start as bucket_start_at,
      least(bucket_start + interval '1 day', (resolved.range_end_date + 1)::timestamp) as bucket_end_at,
      to_char(bucket_start::date, 'YYYY-MM-DD') as bucket_label
    from resolved
    cross join generate_series(
      resolved.range_start_date::timestamp,
      resolved.range_end_date::timestamp,
      interval '1 day'
    ) as bucket_start
    where resolved.bucket_grain = 'day'
  ),
  week_buckets as (
    select
      bucket_start as bucket_start_at,
      least(bucket_start + interval '1 week', (resolved.range_end_date + 1)::timestamp) as bucket_end_at,
      to_char(bucket_start::date, 'YYYY-MM-DD') as bucket_label
    from resolved
    cross join generate_series(
      resolved.range_start_date::timestamp,
      resolved.range_end_date::timestamp,
      interval '1 week'
    ) as bucket_start
    where resolved.bucket_grain = 'week'
  ),
  month_buckets as (
    select
      greatest(bucket_start::date, resolved.range_start_date)::timestamp as bucket_start_at,
      least(
        (bucket_start + interval '1 month'),
        (resolved.range_end_date + 1)::timestamp
      ) as bucket_end_at,
      to_char(greatest(bucket_start::date, resolved.range_start_date), 'YYYY-MM-DD') as bucket_label
    from resolved
    cross join generate_series(
      date_trunc('month', resolved.range_start_date::timestamp),
      resolved.range_end_date::timestamp,
      interval '1 month'
    ) as bucket_start
    where resolved.bucket_grain = 'month'
      and greatest(bucket_start::date, resolved.range_start_date) <= resolved.range_end_date
  ),
  buckets as (
    select * from shift_buckets
    union all
    select * from day_buckets
    union all
    select * from week_buckets
    union all
    select * from month_buckets
  ),
  aggregated as (
    select
      buckets.bucket_start_at,
      buckets.bucket_end_at,
      buckets.bucket_label,
      count(filtered.encounter_id)::bigint as outpatient_count,
      count(distinct filtered.patient_id)::bigint as unique_patient_outpatient_count,
      count(filtered.encounter_id) filter (where filtered.trigger_count > 0)::bigint as triggered_evaluation_count,
      count(filtered.encounter_id) filter (where filtered.success_count > 0)::bigint as success_evaluated_count,
      count(filtered.encounter_id) filter (
        where filtered.was_successfully_evaluated and filtered.diagnosis_basis_incomplete
      )::numeric as diagnosis_basis_incomplete_cases,
      count(filtered.encounter_id) filter (
        where filtered.was_successfully_evaluated and filtered.missing_diagnosis
      )::numeric as missing_diagnosis_cases
    from buckets
    left join filtered
      on filtered.encounter_local_at >= buckets.bucket_start_at
     and filtered.encounter_local_at < buckets.bucket_end_at
    group by
      buckets.bucket_start_at,
      buckets.bucket_end_at,
      buckets.bucket_label
  )
  select
    aggregated.outpatient_count as "outpatientCount",
    aggregated.unique_patient_outpatient_count as "uniquePatientOutpatientCount",
    aggregated.triggered_evaluation_count as "triggeredEvaluationCount",
    aggregated.success_evaluated_count as "successEvaluatedCount",
    case
      when aggregated.success_evaluated_count = 0 then null
      else round(aggregated.diagnosis_basis_incomplete_cases / aggregated.success_evaluated_count, 4)
    end as "diagnosisBasisIncompleteRateBySuccess",
    case
      when aggregated.outpatient_count = 0 then null
      else round(aggregated.diagnosis_basis_incomplete_cases / aggregated.outpatient_count, 4)
    end as "diagnosisBasisIncompleteRateByEncounter",
    case
      when aggregated.success_evaluated_count = 0 then null
      else round(aggregated.missing_diagnosis_cases / aggregated.success_evaluated_count, 4)
    end as "missingDiagnosisRateBySuccess",
    case
      when aggregated.outpatient_count = 0 then null
      else round(aggregated.missing_diagnosis_cases / aggregated.outpatient_count, 4)
    end as "missingDiagnosisRateByEncounter",
    to_char(resolved.range_start_date, 'YYYY-MM-DD') as "rangeStartDate",
    to_char(resolved.range_end_date, 'YYYY-MM-DD') as "rangeEndDate",
    resolved.bucket_grain as "bucketGrain",
    to_char(aggregated.bucket_start_at, 'YYYY-MM-DD"T"HH24:MI:SS') || '+08:00' as "bucketStart",
    to_char((aggregated.bucket_end_at - interval '1 second'), 'YYYY-MM-DD"T"HH24:MI:SS') || '+08:00' as "bucketEnd",
    aggregated.bucket_label as "bucketLabel"
  from aggregated
  cross join resolved
  order by aggregated.bucket_start_at;
$$;

comment on function analytics.get_trend_series(text, date, date, date, text[], text[], text[], text[]) is
  'Trend semantic query with shared filters, shared time window, deterministic shift buckets, and successEvaluatedCount as the default evaluated-case metric.';
