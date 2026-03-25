create or replace view stg_outpatient_encounter_source as
with ranked as (
  select
    trim(encounter_id) as encounter_id,
    trim(case_id) as case_id,
    trim(patient_id) as patient_id,
    encounter_at,
    trim(shift_code) as shift_code,
    trim(department_id) as department_id,
    trim(department_type_id) as department_type_id,
    trim(doctor_id) as doctor_id,
    extract_ts,
    row_number() over (
      partition by trim(encounter_id)
      order by extract_ts desc, coalesce(trim(case_id), '') desc
    ) as rn
  from src_outpatient_encounters
  where encounter_id is not null or case_id is not null
)
select
  encounter_id,
  case_id,
  patient_id,
  encounter_at,
  shift_code,
  department_id,
  department_type_id,
  doctor_id,
  extract_ts
from ranked
where rn = 1
  and encounter_id is not null;

create or replace view stg_outpatient_diagnosis_source as
with normalized as (
  select
    coalesce(trim(d.encounter_id), e.encounter_id) as encounter_id,
    coalesce(trim(d.case_id), e.case_id) as case_id,
    trim(d.disease_code) as disease_code,
    trim(d.disease_name) as disease_name,
    d.diagnosis_version,
    d.diagnosis_present,
    d.extract_ts
  from src_outpatient_diagnoses d
  left join stg_outpatient_encounter_source e
    on trim(d.case_id) = e.case_id
  where d.encounter_id is not null or d.case_id is not null
),
ranked as (
  select
    *,
    row_number() over (
      partition by encounter_id, disease_code
      order by diagnosis_version desc, extract_ts desc
    ) as rn
  from normalized
  where encounter_id is not null
)
select
  encounter_id,
  case_id,
  disease_code,
  disease_name,
  diagnosis_version,
  diagnosis_present,
  extract_ts
from ranked
where rn = 1;

create or replace view stg_evaluation_event_source as
with normalized as (
  select
    trim(ev.evaluation_id) as evaluation_id,
    coalesce(trim(ev.encounter_id), e.encounter_id) as encounter_id,
    coalesce(trim(ev.case_id), e.case_id) as case_id,
    ev.triggered_at,
    trim(ev.status) as status,
    ev.diagnosis_basis_incomplete,
    ev.missing_diagnosis,
    ev.quality_index_score
  from src_evaluation_events ev
  left join stg_outpatient_encounter_source e
    on trim(ev.case_id) = e.case_id
  where ev.encounter_id is not null or ev.case_id is not null
),
ranked as (
  select
    *,
    row_number() over (
      partition by evaluation_id
      order by triggered_at desc, coalesce(encounter_id, '') desc
    ) as rn
  from normalized
  where encounter_id is not null
    and case_id is not null
)
select
  evaluation_id,
  encounter_id,
  case_id,
  triggered_at,
  status,
  diagnosis_basis_incomplete,
  missing_diagnosis,
  quality_index_score
from ranked
where rn = 1;
