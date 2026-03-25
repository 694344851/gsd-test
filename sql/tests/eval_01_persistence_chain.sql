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
  status
) values (
  'eval-phase4-001',
  'enc-001',
  'case-001',
  'pat-001',
  'doctor-001',
  '2026-03-25 09:00:00+08',
  'pending'
);

insert into realtime_evaluation_detail (
  evaluation_id,
  encounter_snapshot
) values (
  'eval-phase4-001',
  '{"diagnoses":[{"disease_name":"疾病A","is_primary":true}]}'::jsonb
);

update realtime_evaluation
set
  status = 'success',
  completed_at = '2026-03-25 09:00:08+08',
  diagnosis_basis_incomplete = true,
  missing_diagnosis = true,
  elapsed_ms = 8123
where evaluation_id = 'eval-phase4-001';

update realtime_evaluation_detail
set
  basis_completeness = '{"verdict":"incomplete","summary":"现病史仍需补充","missing_items":["补充现病史关键症状演变"]}'::jsonb,
  potential_missing_diagnoses = '[{"disease_name":"疾病A","confidence_label":"low","rationale":"仍需复核"}]'::jsonb,
  rationale = '["已记录主诉"]'::jsonb,
  suggestions = '["补录辅助检查结果"]'::jsonb,
  response_payload = '{"status":"success"}'::jsonb
where evaluation_id = 'eval-phase4-001';

insert into realtime_evaluation (
  evaluation_id,
  encounter_id,
  case_id,
  patient_id,
  triggered_by_doctor_id,
  triggered_at,
  completed_at,
  status,
  elapsed_ms,
  error_message
) values
  (
    'eval-phase4-002',
    'enc-002',
    'case-002',
    'pat-002',
    'doctor-002',
    '2026-03-25 09:05:00+08',
    '2026-03-25 09:05:10+08',
    'timeout',
    10000,
    'timed out'
  ),
  (
    'eval-phase4-003',
    'enc-003',
    'case-003',
    'pat-003',
    'doctor-003',
    '2026-03-25 09:10:00+08',
    '2026-03-25 09:10:02+08',
    'failed',
    2040,
    'provider exploded'
  );

insert into realtime_evaluation_detail (
  evaluation_id,
  encounter_snapshot,
  response_payload
) values
  (
    'eval-phase4-002',
    '{"diagnoses":[{"disease_name":"疾病B","is_primary":true}]}'::jsonb,
    '{"status":"timeout"}'::jsonb
  ),
  (
    'eval-phase4-003',
    '{"diagnoses":[{"disease_name":"疾病C","is_primary":true}]}'::jsonb,
    '{"status":"failed"}'::jsonb
  );

do $$
declare
  statuses text[];
  summary record;
begin
  select array_agg(status order by evaluation_id)
  into statuses
  from realtime_evaluation;

  if statuses <> array['success', 'timeout', 'failed'] then
    raise exception 'unexpected realtime evaluation statuses: %', statuses;
  end if;

  select
    status,
    diagnosis_basis_incomplete,
    missing_diagnosis,
    elapsed_ms
  into summary
  from analytics.realtime_evaluation_summary
  where evaluation_id = 'eval-phase4-001';

  if summary.status <> 'success' then
    raise exception 'success row did not persist';
  end if;

  if summary.diagnosis_basis_incomplete is distinct from true then
    raise exception 'diagnosis_basis_incomplete flag missing from success row';
  end if;

  if summary.missing_diagnosis is distinct from true then
    raise exception 'missing_diagnosis flag missing from success row';
  end if;

  if summary.elapsed_ms <> 8123 then
    raise exception 'elapsed_ms not persisted for success row: %', summary.elapsed_ms;
  end if;

  if not exists (
    select 1
    from realtime_evaluation_detail
    where evaluation_id = 'eval-phase4-001'
      and jsonb_array_length(suggestions) = 1
      and jsonb_array_length(potential_missing_diagnoses) = 1
  ) then
    raise exception 'structured detail payload missing for success row';
  end if;
end $$;

rollback;
