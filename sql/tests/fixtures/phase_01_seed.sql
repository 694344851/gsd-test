begin;

truncate table src_outpatient_encounters restart identity cascade;
truncate table src_outpatient_diagnoses restart identity cascade;
truncate table src_evaluation_events restart identity cascade;

insert into src_outpatient_encounters (
  encounter_id,
  case_id,
  patient_id,
  encounter_at,
  shift_code,
  department_id,
  department_type_id,
  doctor_id,
  extract_ts
) values
  ('enc-001', 'case-001', 'pat-001', '2026-03-20 08:30:00+08', 'am', 'dept-ob', 'dept-type-ob', 'doctor-001', '2026-03-20 09:00:00+08'),
  ('enc-001', 'case-001', 'pat-001', '2026-03-20 08:30:00+08', 'am', 'dept-ob', 'dept-type-ob', 'doctor-001', '2026-03-20 10:00:00+08'),
  ('enc-002', 'case-002', 'pat-002', '2026-03-21 14:15:00+08', 'pm', 'dept-gy', 'dept-type-ob', 'doctor-002', '2026-03-21 14:30:00+08'),
  ('enc-003', 'case-003', 'pat-003', '2026-03-22 09:05:00+08', 'am', 'dept-ob', 'dept-type-ob', 'doctor-001', '2026-03-22 09:10:00+08'),
  ('enc-004', 'case-004', 'pat-001', '2026-03-23 13:40:00+08', 'pm', 'dept-gy', 'dept-type-ob', 'doctor-002', '2026-03-23 13:50:00+08'),
  (null, null, 'pat-x', '2026-03-23 16:00:00+08', 'pm', 'dept-gy', 'dept-type-ob', 'doctor-002', '2026-03-23 16:05:00+08');

insert into src_outpatient_diagnoses (
  encounter_id,
  case_id,
  disease_code,
  disease_name,
  diagnosis_version,
  diagnosis_present,
  extract_ts
) values
  ('enc-001', 'case-001', 'disease-a', '疾病A', 1, true, '2026-03-20 09:05:00+08'),
  ('enc-001', 'case-001', 'disease-a', '疾病A', 2, true, '2026-03-20 09:10:00+08'),
  ('enc-002', 'case-002', 'disease-b', '疾病B', 1, true, '2026-03-21 14:40:00+08'),
  ('enc-003', 'case-003', 'disease-a', '疾病A', 1, false, '2026-03-22 09:20:00+08'),
  ('enc-004', 'case-004', 'disease-b', '疾病B', 1, true, '2026-03-23 13:55:00+08'),
  (null, null, 'disease-z', '疾病Z', 1, true, '2026-03-24 08:00:00+08');

insert into src_evaluation_events (
  evaluation_id,
  encounter_id,
  case_id,
  triggered_at,
  status,
  diagnosis_basis_incomplete,
  missing_diagnosis,
  quality_index_score
) values
  ('eval-001-a', 'enc-001', 'case-001', '2026-03-20 09:30:00+08', 'failed', false, false, 61.20),
  ('eval-001-b', 'enc-001', 'case-001', '2026-03-20 09:45:00+08', 'success', false, false, 78.50),
  ('eval-001-b', null, 'case-001', '2026-03-20 10:00:00+08', 'success', true, false, 82.40),
  ('eval-002', 'enc-002', 'case-002', '2026-03-21 15:10:00+08', 'failed', false, true, 45.00),
  ('eval-003', null, 'case-003', '2026-03-22 10:05:00+08', 'timeout', false, false, 30.00),
  ('eval-null-key', null, null, '2026-03-22 11:00:00+08', 'failed', false, false, 0.00);

select analytics.refresh_phase1_foundation();

commit;
