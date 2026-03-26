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
) values (
  'enc-dist-001',
  'case-dist-001',
  'pat-dist-001',
  '2026-03-21 09:30:00+08',
  'am',
  'dept-endo',
  'dept-type-endo',
  'doctor-003',
  '2026-03-21 09:40:00+08'
);

insert into src_outpatient_diagnoses (
  encounter_id,
  case_id,
  disease_code,
  disease_name,
  diagnosis_version,
  diagnosis_present,
  extract_ts
) values (
  'enc-dist-001',
  'case-dist-001',
  'disease-c',
  '疾病C',
  1,
  true,
  '2026-03-21 09:42:00+08'
);

insert into src_evaluation_events (
  evaluation_id,
  encounter_id,
  case_id,
  triggered_at,
  status,
  diagnosis_basis_incomplete,
  missing_diagnosis,
  quality_index_score
) values (
  'eval-dist-001',
  'enc-dist-001',
  'case-dist-001',
  '2026-03-21 10:00:00+08',
  'success',
  false,
  true,
  73.20
);

select analytics.refresh_phase1_foundation();

do $$
declare
  row_count integer;
  filtered_count integer;
  option_count integer;
  first_row record;
begin
  select count(*)
    into row_count
  from analytics.get_department_distribution('last_7_days', date '2026-03-24');

  if row_count <> 3 then
    raise exception 'Expected 3 department rows, found %', row_count;
  end if;

  select *
    into first_row
  from analytics.get_department_distribution('last_7_days', date '2026-03-24')
  order by "outpatientCount" desc, "departmentName" asc
  limit 1;

  if first_row."departmentName" is null
     or first_row."departmentTypeName" is null
     or first_row."outpatientCount" <= 0 then
    raise exception 'Expected populated department distribution row, got %', row_to_json(first_row);
  end if;

  select count(*)
    into filtered_count
  from analytics.get_department_distribution(
    'last_7_days',
    date '2026-03-24',
    null,
    null,
    null,
    array['dept-type-ob'],
    null,
    null
  );

  if filtered_count >= row_count then
    raise exception 'departmentTypeIds filter should change result size, found % vs %', filtered_count, row_count;
  end if;

  select count(distinct department_type_id)
    into option_count
  from analytics.dim_department_type;

  if option_count < 1 then
    raise exception 'Expected at least one available department type option';
  end if;
end $$;

rollback;
