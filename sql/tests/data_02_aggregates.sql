begin;

create temp table overview_result as
select *
from analytics.get_overview_summary('last_7_days', date '2026-03-24');

create temp table trend_result as
select *
from analytics.get_trend_series('last_7_days', date '2026-03-24');

do $$
declare
  overview_row record;
  dept_filtered record;
  doctor_filtered record;
  placeholder_enabled_result boolean;
  placeholder_value_result numeric;
  has_quality_index boolean;
  field_count integer;
begin
  select *
    into overview_row
  from overview_result;

  if overview_row."outpatientCount" <> 4 then
    raise exception 'Expected outpatientCount=4, found %', overview_row."outpatientCount";
  end if;

  if overview_row."uniquePatientOutpatientCount" <> 3 then
    raise exception 'Expected uniquePatientOutpatientCount=3, found %', overview_row."uniquePatientOutpatientCount";
  end if;

  if overview_row."triggeredEvaluationCount" <> 3 then
    raise exception 'Expected triggeredEvaluationCount=3, found %', overview_row."triggeredEvaluationCount";
  end if;

  if overview_row."successEvaluatedCount" <> 1 then
    raise exception 'Expected successEvaluatedCount=1, found %', overview_row."successEvaluatedCount";
  end if;

  if overview_row."diagnosisBasisIncompleteRateBySuccess" <> 1.0000 then
    raise exception
      'Expected diagnosisBasisIncompleteRateBySuccess=1.0000, found %',
      overview_row."diagnosisBasisIncompleteRateBySuccess";
  end if;

  if overview_row."diagnosisBasisIncompleteRateByEncounter" <> 0.2500 then
    raise exception
      'Expected diagnosisBasisIncompleteRateByEncounter=0.2500, found %',
      overview_row."diagnosisBasisIncompleteRateByEncounter";
  end if;

  if overview_row."missingDiagnosisRateBySuccess" <> 0.0000 then
    raise exception
      'Expected missingDiagnosisRateBySuccess=0.0000, found %',
      overview_row."missingDiagnosisRateBySuccess";
  end if;

  if overview_row."missingDiagnosisRateByEncounter" <> 0.0000 then
    raise exception
      'Expected missingDiagnosisRateByEncounter=0.0000, found %',
      overview_row."missingDiagnosisRateByEncounter";
  end if;

  if overview_row."rangeStartDate" <> '2026-03-17'
     or overview_row."rangeEndDate" <> '2026-03-23'
     or overview_row."bucketGrain" <> 'shift' then
    raise exception
      'Expected last_7_days range 2026-03-17..2026-03-23/shift, got %..%/%',
      overview_row."rangeStartDate",
      overview_row."rangeEndDate",
      overview_row."bucketGrain";
  end if;

  select *
    into dept_filtered
  from analytics.get_overview_summary(
    'last_7_days',
    date '2026-03-24',
    null,
    null,
    array['dept-ob'],
    null,
    null,
    null
  );

  if dept_filtered."outpatientCount" >= overview_row."outpatientCount" then
    raise exception 'departmentIds filter should reduce outpatientCount, found %', dept_filtered."outpatientCount";
  end if;

  if dept_filtered."outpatientCount" <> 2 or dept_filtered."successEvaluatedCount" <> 1 then
    raise exception
      'departmentIds filter should return outpatientCount=2 and successEvaluatedCount=1, found % and %',
      dept_filtered."outpatientCount",
      dept_filtered."successEvaluatedCount";
  end if;

  select *
    into doctor_filtered
  from analytics.get_overview_summary(
    'last_7_days',
    date '2026-03-24',
    null,
    null,
    null,
    null,
    array['doctor-001'],
    null
  );

  if doctor_filtered."outpatientCount" <> 2 or doctor_filtered."triggeredEvaluationCount" <> 2 then
    raise exception
      'doctorIds filter should return outpatientCount=2 and triggeredEvaluationCount=2, found % and %',
      doctor_filtered."outpatientCount",
      doctor_filtered."triggeredEvaluationCount";
  end if;

  select config.is_enabled, config.placeholder_value
    into placeholder_enabled_result, placeholder_value_result
  from analytics.metric_placeholder_config
  as config
  where metric_key = 'quality_index_score';

  if placeholder_enabled_result is distinct from false or placeholder_value_result is not null then
    raise exception 'quality_index_score placeholder must remain disabled with null value';
  end if;

  select exists (
    select 1
    from pg_attribute
    where attrelid = 'pg_temp.overview_result'::regclass
      and attnum > 0
      and not attisdropped
      and attname = 'qualityIndexScore'
  )
    into has_quality_index;

  if has_quality_index then
    raise exception 'overview output must not expose qualityIndexScore';
  end if;

  select exists (
    select 1
    from pg_attribute
    where attrelid = 'pg_temp.trend_result'::regclass
      and attnum > 0
      and not attisdropped
      and attname = 'qualityIndexScore'
  )
    into has_quality_index;

  if has_quality_index then
    raise exception 'trend output must not expose qualityIndexScore';
  end if;

  select count(*)
    into field_count
  from pg_attribute
  where attrelid = 'pg_temp.overview_result'::regclass
    and attnum > 0
    and not attisdropped
    and attname in (
      'outpatientCount',
      'uniquePatientOutpatientCount',
      'triggeredEvaluationCount',
      'successEvaluatedCount',
      'rangeStartDate',
      'rangeEndDate',
      'bucketGrain'
    );

  if field_count <> 7 then
    raise exception 'Overview output is missing expected camelCase aliases, found % fields', field_count;
  end if;

  if not exists (
    select 1
    from trend_result
    where "bucketLabel" = '2026-03-20 AM'
      and "outpatientCount" = 1
      and "successEvaluatedCount" = 1
      and "diagnosisBasisIncompleteRateBySuccess" = 1.0000
  ) then
    raise exception 'Trend output should expose camelCase metrics for the 2026-03-20 AM bucket';
  end if;
end $$;

rollback;
