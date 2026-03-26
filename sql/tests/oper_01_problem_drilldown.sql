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
    'eval-oper-001',
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
    'eval-oper-002',
    'enc-002',
    'case-002',
    'pat-002',
    'doctor-002',
    '2026-03-24 10:18:00+08',
    '2026-03-24 10:18:04+08',
    'failed',
    false,
    true,
    4020
  );

do $$
declare
  department_count integer;
  doctor_count integer;
  disease_count integer;
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
  )
  select count(*)
    into department_count
  from analytics.fact_outpatient_encounter encounter
  join ranked
    on ranked.encounter_id = encounter.encounter_id
   and ranked.evaluation_rank = 1
  cross join resolved
  where encounter.department_id = 'dept-ob'
    and (encounter.encounter_at at time zone 'Asia/Shanghai')::date between resolved.range_start_date and resolved.range_end_date
    and (ranked.diagnosis_basis_incomplete or ranked.missing_diagnosis or ranked.status in ('failed', 'timeout'));

  if department_count <> 1 then
    raise exception 'expected 1 drilldown case for dept-ob, found %', department_count;
  end if;

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
  )
  select count(*)
    into doctor_count
  from analytics.fact_outpatient_encounter encounter
  join ranked
    on ranked.encounter_id = encounter.encounter_id
   and ranked.evaluation_rank = 1
  cross join resolved
  where encounter.doctor_id = 'doctor-001'
    and (encounter.encounter_at at time zone 'Asia/Shanghai')::date between resolved.range_start_date and resolved.range_end_date
    and (ranked.diagnosis_basis_incomplete or ranked.missing_diagnosis or ranked.status in ('failed', 'timeout'));

  if doctor_count <> 1 then
    raise exception 'expected 1 drilldown case for doctor-001, found %', doctor_count;
  end if;

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
  )
  select count(*)
    into disease_count
  from analytics.fact_outpatient_encounter encounter
  join ranked
    on ranked.encounter_id = encounter.encounter_id
   and ranked.evaluation_rank = 1
  cross join resolved
  where encounter.disease_id = 'disease-a'
    and (encounter.encounter_at at time zone 'Asia/Shanghai')::date between resolved.range_start_date and resolved.range_end_date
    and (ranked.diagnosis_basis_incomplete or ranked.missing_diagnosis or ranked.status in ('failed', 'timeout'));

  if disease_count <> 1 then
    raise exception 'expected 1 drilldown case for disease-a, found %', disease_count;
  end if;
end $$;

rollback;
