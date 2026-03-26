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
  'enc-prev-001',
  'case-prev-001',
  'pat-prev-001',
  '2025-10-08 09:00:00+08',
  'am',
  'dept-ob',
  'dept-type-ob',
  'doctor-001',
  '2025-10-08 09:10:00+08'
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
  'enc-prev-001',
  'case-prev-001',
  'disease-a',
  '疾病A',
  1,
  true,
  '2025-10-08 09:12:00+08'
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
  'eval-prev-001',
  'enc-prev-001',
  'case-prev-001',
  '2025-10-08 09:20:00+08',
  'success',
  false,
  false,
  80.00
);

select analytics.refresh_phase1_foundation();

do $$
declare
  current_window record;
  previous_window record;
  current_summary record;
  previous_summary record;
begin
  select *
    into current_window
  from analytics.resolve_time_window('last_3_months', date '2026-03-24');

  if current_window.range_start_date <> date '2025-12-22'
     or current_window.range_end_date <> date '2026-03-23' then
    raise exception
      'Expected default overview window 2025-12-22..2026-03-23 for 2026-03-24, got %..%',
      current_window.range_start_date,
      current_window.range_end_date;
  end if;

  select
    (current_window.range_start_date - ((current_window.range_end_date - current_window.range_start_date) + 1))::date as previous_start_date,
    (current_window.range_start_date - 1)::date as previous_end_date
    into previous_window;

  if previous_window.previous_start_date <> date '2025-09-21'
     or previous_window.previous_end_date <> date '2025-12-21' then
    raise exception
      'Expected previous window 2025-09-21..2025-12-21, got %..%',
      previous_window.previous_start_date,
      previous_window.previous_end_date;
  end if;

  select *
    into current_summary
  from analytics.get_overview_summary('last_3_months', date '2026-03-24');

  if current_summary."rangeStartDate" <> '2025-12-22'
     or current_summary."rangeEndDate" <> '2026-03-23' then
    raise exception
      'Expected overview summary to echo current range_start_date/range_end_date, got %..%',
      current_summary."rangeStartDate",
      current_summary."rangeEndDate";
  end if;

  select *
    into previous_summary
  from analytics.get_overview_summary(
    'custom',
    date '2026-03-24',
    previous_window.previous_start_date,
    previous_window.previous_end_date
  );

  if previous_summary."rangeStartDate" <> '2025-09-21'
     or previous_summary."rangeEndDate" <> '2025-12-21' then
    raise exception
      'Expected previous_summary to expose 2025-09-21..2025-12-21, got %..%',
      previous_summary."rangeStartDate",
      previous_summary."rangeEndDate";
  end if;

  if previous_summary."outpatientCount" = 0 then
    raise exception 'Expected previous_summary to be non-empty for comparable overview cards';
  end if;
end $$;

rollback;
