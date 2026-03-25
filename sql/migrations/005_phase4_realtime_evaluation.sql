create table if not exists realtime_evaluation (
  evaluation_id text primary key,
  encounter_id text not null,
  case_id text not null,
  patient_id text not null,
  triggered_by_doctor_id text not null,
  triggered_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('pending', 'success', 'timeout', 'failed')),
  diagnosis_basis_incomplete boolean not null default false,
  missing_diagnosis boolean not null default false,
  quality_index_score numeric(6,2),
  elapsed_ms integer,
  error_message text
);

create index if not exists idx_realtime_evaluation_encounter_triggered
  on realtime_evaluation (encounter_id, triggered_at desc);

create index if not exists idx_realtime_evaluation_case_triggered
  on realtime_evaluation (case_id, triggered_at desc);

create index if not exists idx_realtime_evaluation_status_triggered
  on realtime_evaluation (status, triggered_at desc);

create table if not exists realtime_evaluation_detail (
  evaluation_id text primary key references realtime_evaluation(evaluation_id) on delete cascade,
  encounter_snapshot jsonb not null default '{}'::jsonb,
  basis_completeness jsonb,
  potential_missing_diagnoses jsonb not null default '[]'::jsonb,
  rationale jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  response_payload jsonb,
  updated_at timestamptz not null default now()
);

create or replace view analytics.realtime_evaluation_summary as
select
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
  quality_index_score,
  elapsed_ms
from realtime_evaluation;
