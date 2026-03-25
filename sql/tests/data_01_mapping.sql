begin;

do $$
declare
  missing_count integer;
  encounter_count integer;
  patient_count integer;
  case_state text;
  latest_success text;
  null_key_fact_rows integer;
begin
  select count(*)
    into missing_count
  from (
    select 'stg_outpatient_encounter_source' as object_name
    union all select 'stg_outpatient_diagnosis_source'
    union all select 'stg_evaluation_event_source'
    union all select 'analytics.fact_outpatient_encounter'
    union all select 'analytics.fact_evaluation_event'
    union all select 'analytics.mart_case_evaluation'
    union all select 'analytics.mart_outpatient_volume'
  ) required
  where to_regclass(object_name) is null;

  if missing_count <> 0 then
    raise exception 'Required staging/fact/mart objects are missing (% objects)', missing_count;
  end if;

  select count(*) into encounter_count from analytics.fact_outpatient_encounter;
  if encounter_count <> 4 then
    raise exception 'Expected 4 encounter fact rows, found %', encounter_count;
  end if;

  select count(*) into patient_count from (
    select distinct patient_id from analytics.fact_outpatient_encounter
  ) patients;
  if patient_count <> 3 then
    raise exception 'Expected 3 unique patients, found %', patient_count;
  end if;

  select latest_success_evaluation_id
    into latest_success
  from analytics.mart_case_evaluation
  where encounter_id = 'enc-001';
  if latest_success <> 'eval-001-b' then
    raise exception 'enc-001 should resolve latest successful evaluation eval-001-b, found %', latest_success;
  end if;

  if not exists (
    select 1
    from analytics.mart_case_evaluation
    where encounter_id = 'enc-001'
      and evaluation_state = 'success'
      and diagnosis_basis_incomplete = true
      and missing_diagnosis = false
  ) then
    raise exception 'enc-001 should keep the latest successful evaluation flags';
  end if;

  select evaluation_state
    into case_state
  from analytics.mart_case_evaluation
  where encounter_id = 'enc-004';
  if case_state <> 'not_triggered' then
    raise exception 'enc-004 should be not_triggered, found %', case_state;
  end if;

  select count(*)
    into null_key_fact_rows
  from analytics.fact_outpatient_encounter
  where encounter_id is null
     or case_id is null;
  if null_key_fact_rows <> 0 then
    raise exception 'Encounter fact loaded null encounter/case keys';
  end if;

  select count(*)
    into null_key_fact_rows
  from analytics.fact_evaluation_event
  where encounter_id is null
     or case_id is null;
  if null_key_fact_rows <> 0 then
    raise exception 'Evaluation fact loaded null encounter/case keys';
  end if;

  if not exists (
    select 1
    from analytics.mart_outpatient_volume
    where encounter_outpatient_count = 4
      and unique_patient_outpatient_count = 3
  ) then
    raise exception 'Outpatient volume mart must preserve encounter_count=4 and unique_patient_count=3';
  end if;
end $$;

rollback;
