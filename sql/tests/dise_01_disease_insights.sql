begin;

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
  ('enc-dise-001', 'case-dise-001', 'pat-dise-001', '2026-03-20 09:00:00+08', 'am', 'dept-ob', 'dept-type-ob', 'doctor-001', '2026-03-20 09:05:00+08'),
  ('enc-dise-002', 'case-dise-002', 'pat-dise-002', '2026-03-20 10:00:00+08', 'am', 'dept-ob', 'dept-type-ob', 'doctor-001', '2026-03-20 10:05:00+08'),
  ('enc-dise-003', 'case-dise-003', 'pat-dise-003', '2026-03-21 09:00:00+08', 'am', 'dept-ob', 'dept-type-ob', 'doctor-001', '2026-03-21 09:05:00+08'),
  ('enc-dise-004', 'case-dise-004', 'pat-dise-004', '2026-03-21 10:00:00+08', 'am', 'dept-gy', 'dept-type-ob', 'doctor-002', '2026-03-21 10:05:00+08'),
  ('enc-dise-005', 'case-dise-005', 'pat-dise-005', '2026-03-22 09:00:00+08', 'am', 'dept-gy', 'dept-type-ob', 'doctor-002', '2026-03-22 09:05:00+08'),
  ('enc-dise-006', 'case-dise-006', 'pat-dise-006', '2026-03-22 10:00:00+08', 'am', 'dept-endo', 'dept-type-endo', 'doctor-003', '2026-03-22 10:05:00+08'),
  ('enc-dise-007', 'case-dise-007', 'pat-dise-007', '2026-03-23 09:00:00+08', 'am', 'dept-endo', 'dept-type-endo', 'doctor-003', '2026-03-23 09:05:00+08');

insert into src_outpatient_diagnoses (
  encounter_id,
  case_id,
  disease_code,
  disease_name,
  diagnosis_version,
  diagnosis_present,
  extract_ts
) values
  ('enc-dise-001', 'case-dise-001', 'disease-c', '疾病C', 1, true, '2026-03-20 09:06:00+08'),
  ('enc-dise-002', 'case-dise-002', 'disease-c', '疾病C', 1, true, '2026-03-20 10:06:00+08'),
  ('enc-dise-003', 'case-dise-003', 'disease-d', '疾病D', 1, true, '2026-03-21 09:06:00+08'),
  ('enc-dise-004', 'case-dise-004', 'disease-d', '疾病D', 1, true, '2026-03-21 10:06:00+08'),
  ('enc-dise-005', 'case-dise-005', 'disease-e', '疾病E', 1, true, '2026-03-22 09:06:00+08'),
  ('enc-dise-006', 'case-dise-006', 'disease-f', '疾病F', 1, true, '2026-03-22 10:06:00+08'),
  ('enc-dise-007', 'case-dise-007', 'disease-g', '疾病G', 1, true, '2026-03-23 09:06:00+08');

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
  ('eval-dise-001', 'enc-dise-001', 'case-dise-001', '2026-03-20 09:15:00+08', 'success', true, true, 42.0),
  ('eval-dise-002', 'enc-dise-002', 'case-dise-002', '2026-03-20 10:15:00+08', 'success', true, true, 44.0),
  ('eval-dise-003', 'enc-dise-003', 'case-dise-003', '2026-03-21 09:15:00+08', 'success', false, true, 50.0),
  ('eval-dise-004', 'enc-dise-004', 'case-dise-004', '2026-03-21 10:15:00+08', 'success', true, false, 52.0),
  ('eval-dise-005', 'enc-dise-005', 'case-dise-005', '2026-03-22 09:15:00+08', 'success', false, true, 55.0),
  ('eval-dise-006', 'enc-dise-006', 'case-dise-006', '2026-03-22 10:15:00+08', 'success', true, false, 60.0),
  ('eval-dise-007', 'enc-dise-007', 'case-dise-007', '2026-03-23 09:15:00+08', 'success', false, true, 62.0);

select analytics.refresh_phase1_foundation();

do $$
declare
  row_count integer;
  top_row record;
  second_row record;
  third_row record;
  last_row record;
  filtered_count integer;
begin
  select count(*)
    into row_count
  from analytics.get_disease_insights('last_7_days', date '2026-03-24');

  if row_count <> 6 then
    raise exception 'Expected 6 disease rows, found %', row_count;
  end if;

  select *
    into top_row
  from analytics.get_disease_insights('last_7_days', date '2026-03-24')
  order by "issueCount" desc, "diseaseName" asc
  limit 1;

  if top_row."diseaseName" <> '疾病C'
     or top_row."issueCount" <> 4
     or top_row."severityBand" <> 'top_20'
     or top_row."severityRatio" <> 1.0000 then
    raise exception 'Expected top disease row for 疾病C, got %', row_to_json(top_row);
  end if;

  select *
    into second_row
  from analytics.get_disease_insights('last_7_days', date '2026-03-24')
  offset 1
  limit 1;

  if second_row."diseaseName" <> '疾病D'
     or second_row."issueCount" <> 2
     or second_row."severityBand" <> 'top_20' then
    raise exception 'Expected second disease row for 疾病D, got %', row_to_json(second_row);
  end if;

  select *
    into third_row
  from analytics.get_disease_insights('last_7_days', date '2026-03-24')
  offset 2
  limit 1;

  if third_row."severityBand" <> 'top_50' then
    raise exception 'Expected top_50 band on third row, got %', row_to_json(third_row);
  end if;

  select *
    into last_row
  from analytics.get_disease_insights('last_7_days', date '2026-03-24')
  offset 5
  limit 1;

  if last_row."severityBand" <> 'tail' then
    raise exception 'Expected tail band on last row, got %', row_to_json(last_row);
  end if;

  select count(*)
    into filtered_count
  from analytics.get_disease_insights(
    'last_7_days',
    date '2026-03-24',
    null,
    null,
    null,
    array['dept-type-endo'],
    null,
    null
  );

  if filtered_count <> 2 then
    raise exception 'Expected 2 endocrine disease rows after departmentTypeIds filter, found %', filtered_count;
  end if;
end $$;

rollback;
