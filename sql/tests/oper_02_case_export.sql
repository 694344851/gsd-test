begin;

truncate table realtime_evaluation_detail restart identity cascade;
truncate table realtime_evaluation restart identity cascade;

insert into realtime_evaluation (
  evaluation_id,
  encounter_id,
  case_id,
  patient_id,
  triggered_by_doctor_id,
  triggered_at,
  completed_at,
  status,
  diagnosis_basis_incomplete,
  missing_diagnosis,
  elapsed_ms
) values
  (
    'eval-export-001',
    'enc-001',
    'case-001',
    'pat-001',
    'doctor-001',
    '2026-03-24 09:12:00+08',
    '2026-03-24 09:12:08+08',
    'success',
    true,
    false,
    8123
  ),
  (
    'eval-export-004',
    'enc-004',
    'case-004',
    'pat-001',
    'doctor-002',
    '2026-03-24 11:12:00+08',
    '2026-03-24 11:12:08+08',
    'success',
    false,
    true,
    9021
  );

do $$
declare
  exported_ids text[];
begin
  with resolved as (
    select *
    from analytics.resolve_time_window('last_3_months', date '2026-03-24', null, null)
  ),
  ranked as (
    select
      evaluation.*,
      row_number() over (
        partition by evaluation.encounter_id
        order by evaluation.triggered_at desc, evaluation.evaluation_id desc
      ) as evaluation_rank
    from analytics.realtime_evaluation_summary evaluation
  ),
  exported as (
    select encounter.encounter_id
    from analytics.fact_outpatient_encounter encounter
    join ranked
      on ranked.encounter_id = encounter.encounter_id
     and ranked.evaluation_rank = 1
    cross join resolved
    where (encounter.encounter_at at time zone 'Asia/Shanghai')::date between resolved.range_start_date and resolved.range_end_date
      and (ranked.diagnosis_basis_incomplete or ranked.missing_diagnosis or ranked.status in ('failed', 'timeout'))
    order by ranked.triggered_at desc, encounter.encounter_id desc
  )
  select array_agg(encounter_id order by encounter_id)
    into exported_ids
  from exported;

  if exported_ids <> array['enc-001', 'enc-004'] then
    raise exception 'unexpected export row set: %', exported_ids;
  end if;
end $$;

rollback;
