create schema if not exists analytics;

create table if not exists src_outpatient_encounters (
  encounter_id text,
  case_id text,
  patient_id text not null,
  encounter_at timestamptz not null,
  shift_code text not null,
  department_id text not null,
  department_type_id text not null,
  doctor_id text not null,
  extract_ts timestamptz not null
);

create table if not exists src_outpatient_diagnoses (
  encounter_id text,
  case_id text,
  disease_code text not null,
  disease_name text,
  diagnosis_version integer not null,
  diagnosis_present boolean not null default true,
  extract_ts timestamptz not null
);

create table if not exists src_evaluation_events (
  evaluation_id text not null,
  encounter_id text,
  case_id text,
  triggered_at timestamptz not null,
  status text not null,
  diagnosis_basis_incomplete boolean not null default false,
  missing_diagnosis boolean not null default false,
  quality_index_score numeric(6,2)
);

create table if not exists analytics.dim_department_type (
  department_type_id text primary key,
  department_type_name text not null
);

create table if not exists analytics.dim_department (
  department_id text primary key,
  department_type_id text not null references analytics.dim_department_type(department_type_id),
  department_name text not null
);

create table if not exists analytics.dim_doctor (
  doctor_id text primary key,
  doctor_name text not null
);

create table if not exists analytics.dim_disease (
  disease_id text primary key,
  disease_name text not null
);

create table if not exists analytics.fact_outpatient_encounter (
  encounter_id text primary key,
  case_id text not null unique,
  patient_id text not null,
  encounter_at timestamptz not null,
  shift_code text not null,
  department_id text not null references analytics.dim_department(department_id),
  department_type_id text not null references analytics.dim_department_type(department_type_id),
  doctor_id text not null references analytics.dim_doctor(doctor_id),
  disease_id text references analytics.dim_disease(disease_id),
  is_diagnosis_present boolean not null default false
);

create table if not exists analytics.fact_evaluation_event (
  evaluation_id text primary key,
  encounter_id text not null references analytics.fact_outpatient_encounter(encounter_id),
  case_id text not null,
  triggered_at timestamptz not null,
  status text not null check (status in ('success', 'failed', 'timeout')),
  diagnosis_basis_incomplete boolean not null default false,
  missing_diagnosis boolean not null default false,
  quality_index_score numeric(6,2)
);

create index if not exists idx_fact_outpatient_encounter_encounter_at
  on analytics.fact_outpatient_encounter(encounter_at);

create index if not exists idx_fact_outpatient_encounter_patient_at
  on analytics.fact_outpatient_encounter(patient_id, encounter_at);

create index if not exists idx_fact_outpatient_encounter_dims
  on analytics.fact_outpatient_encounter(department_id, doctor_id, disease_id);

create index if not exists idx_fact_evaluation_event_encounter_triggered
  on analytics.fact_evaluation_event(encounter_id, triggered_at desc);

create index if not exists idx_fact_evaluation_event_success_encounter_triggered
  on analytics.fact_evaluation_event(encounter_id, triggered_at desc)
  where status = 'success';

create or replace function analytics.refresh_phase1_foundation()
returns void
language plpgsql
as $$
begin
  truncate table analytics.fact_evaluation_event;
  truncate table analytics.fact_outpatient_encounter cascade;
  truncate table analytics.dim_department restart identity cascade;
  truncate table analytics.dim_department_type restart identity cascade;
  truncate table analytics.dim_doctor restart identity cascade;
  truncate table analytics.dim_disease restart identity cascade;

  insert into analytics.dim_department_type (department_type_id, department_type_name)
  select distinct
    department_type_id,
    case department_type_id
      when 'dept-type-ob' then '妇产门诊'
      else department_type_id
    end
  from stg_outpatient_encounter_source;

  insert into analytics.dim_department (department_id, department_type_id, department_name)
  select distinct
    department_id,
    department_type_id,
    case department_id
      when 'dept-ob' then '产科门诊'
      when 'dept-gy' then '妇科门诊'
      else department_id
    end
  from stg_outpatient_encounter_source;

  insert into analytics.dim_doctor (doctor_id, doctor_name)
  select distinct
    doctor_id,
    case doctor_id
      when 'doctor-001' then '医生一'
      when 'doctor-002' then '医生二'
      else doctor_id
    end
  from stg_outpatient_encounter_source;

  insert into analytics.dim_disease (disease_id, disease_name)
  select distinct
    disease_code,
    coalesce(nullif(disease_name, ''), disease_code)
  from stg_outpatient_diagnosis_source;

  insert into analytics.fact_outpatient_encounter (
    encounter_id,
    case_id,
    patient_id,
    encounter_at,
    shift_code,
    department_id,
    department_type_id,
    doctor_id,
    disease_id,
    is_diagnosis_present
  )
  select
    encounter.encounter_id,
    encounter.case_id,
    encounter.patient_id,
    encounter.encounter_at,
    encounter.shift_code,
    encounter.department_id,
    encounter.department_type_id,
    encounter.doctor_id,
    diagnosis.disease_code,
    coalesce(diagnosis.diagnosis_present, false)
  from stg_outpatient_encounter_source encounter
  left join stg_outpatient_diagnosis_source diagnosis
    on diagnosis.encounter_id = encounter.encounter_id;

  insert into analytics.fact_evaluation_event (
    evaluation_id,
    encounter_id,
    case_id,
    triggered_at,
    status,
    diagnosis_basis_incomplete,
    missing_diagnosis,
    quality_index_score
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
  from stg_evaluation_event_source;

  refresh materialized view analytics.mart_case_evaluation;
  refresh materialized view analytics.mart_outpatient_volume;
end;
$$;

drop materialized view if exists analytics.mart_case_evaluation;
create materialized view analytics.mart_case_evaluation as
with ranked_success as (
  select
    event.*,
    row_number() over (
      partition by encounter_id
      order by triggered_at desc, evaluation_id desc
    ) as success_rank
  from analytics.fact_evaluation_event event
  where status = 'success'
),
ranked_latest as (
  select
    event.*,
    row_number() over (
      partition by encounter_id
      order by triggered_at desc, evaluation_id desc
    ) as latest_rank
  from analytics.fact_evaluation_event event
),
event_counts as (
  select
    encounter_id,
    count(*) as trigger_count,
    count(*) filter (where status = 'success') as success_count
  from analytics.fact_evaluation_event
  group by encounter_id
)
select
  encounter.encounter_id,
  encounter.case_id,
  encounter.patient_id,
  encounter.encounter_at,
  coalesce(counts.trigger_count, 0) as trigger_count,
  coalesce(counts.success_count, 0) as success_count,
  success.evaluation_id as latest_success_evaluation_id,
  (coalesce(counts.success_count, 0) > 0) as was_successfully_evaluated,
  case
    when coalesce(counts.trigger_count, 0) = 0 then 'not_triggered'
    when coalesce(counts.success_count, 0) > 0 then 'success'
    else latest.status
  end as evaluation_state,
  success.diagnosis_basis_incomplete,
  success.missing_diagnosis,
  success.quality_index_score
from analytics.fact_outpatient_encounter encounter
left join event_counts counts
  on counts.encounter_id = encounter.encounter_id
left join ranked_success success
  on success.encounter_id = encounter.encounter_id
 and success.success_rank = 1
left join ranked_latest latest
  on latest.encounter_id = encounter.encounter_id
 and latest.latest_rank = 1;

drop materialized view if exists analytics.mart_outpatient_volume;
create materialized view analytics.mart_outpatient_volume as
select
  coalesce(bucket_start, min(date_trunc('day', encounter_at))) as bucket_start,
  case when bucket_start is null then 'all' else 'day' end as bucket_grain,
  count(*) as encounter_outpatient_count,
  count(distinct patient_id) as unique_patient_outpatient_count
from (
  select
    encounter_at,
    patient_id,
    date_trunc('day', encounter_at) as bucket_start
  from analytics.fact_outpatient_encounter
) base
group by grouping sets ((bucket_start), ());
