# Phase 1 Field Mapping Matrix

| source_entity | source_column | target_layer | target_object | target_column | transform_rule |
|---|---|---|---|---|---|
| `src_outpatient_encounters` | `encounter_id` | staging | `stg_outpatient_encounter_source` | `encounter_id` | Trim and reject rows only when both `encounter_id` and `case_id` are null |
| `src_outpatient_encounters` | `case_id` | staging | `stg_outpatient_encounter_source` | `case_id` | Preserve as nullable correlation key |
| `src_outpatient_encounters` | `patient_id` | fact | `analytics.fact_outpatient_encounter` | `patient_id` | Required for unique-patient outpatient counts |
| `src_outpatient_encounters` | `encounter_at` | fact | `analytics.fact_outpatient_encounter` | `encounter_at` | Normalize to analytics encounter timestamp |
| `src_outpatient_encounters` | `shift_code` | fact | `analytics.fact_outpatient_encounter` | `shift_code` | Preserve source shift bucket |
| `src_outpatient_encounters` | `department_type_id` | dimension | `analytics.dim_department_type` | `department_type_id` | Upsert distinct department type identifiers |
| `src_outpatient_encounters` | `department_id` | dimension | `analytics.dim_department` | `department_id` | Upsert distinct departments and retain parent department type |
| `src_outpatient_encounters` | `doctor_id` | dimension | `analytics.dim_doctor` | `doctor_id` | Upsert distinct doctor ids |
| `src_outpatient_diagnoses` | `disease_code` | dimension | `analytics.dim_disease` | `disease_id` | Map disease code to disease dimension key |
| `src_outpatient_diagnoses` | `disease_name` | dimension | `analytics.dim_disease` | `disease_name` | Keep latest non-null disease name from deduplicated diagnosis row |
| `src_outpatient_diagnoses` | `diagnosis_present` | fact | `analytics.fact_outpatient_encounter` | `is_diagnosis_present` | Default false when no diagnosis row survives deduplication |
| `src_outpatient_diagnoses` | `disease_code` | fact | `analytics.fact_outpatient_encounter` | `disease_id` | Join deduplicated diagnosis row into encounter fact |
| `src_evaluation_events` | `evaluation_id` | staging | `stg_evaluation_event_source` | `evaluation_id` | Deduplicate by latest `triggered_at` per evaluation id |
| `src_evaluation_events` | `encounter_id` | staging | `stg_evaluation_event_source` | `encounter_id` | Prefer source `encounter_id`, else recover from encounter source via `case_id` |
| `src_evaluation_events` | `case_id` | fact | `analytics.fact_evaluation_event` | `case_id` | Preserve fallback correlation key for auditability |
| `src_evaluation_events` | `triggered_at` | fact | `analytics.fact_evaluation_event` | `triggered_at` | Preserve event time for ranking latest successful evaluation |
| `src_evaluation_events` | `status` | fact | `analytics.fact_evaluation_event` | `status` | Constrain to `success`, `failed`, `timeout` |
| `src_evaluation_events` | `diagnosis_basis_incomplete` | fact | `analytics.fact_evaluation_event` | `diagnosis_basis_incomplete` | Keep event-level issue flag |
| `src_evaluation_events` | `missing_diagnosis` | fact | `analytics.fact_evaluation_event` | `missing_diagnosis` | Keep event-level issue flag |
| `src_evaluation_events` | `quality_index_score` | fact | `analytics.fact_evaluation_event` | `quality_index_score` | Preserve placeholder score for later configurable index work |
| `analytics.fact_outpatient_encounter` | `encounter_id` | mart | `analytics.mart_case_evaluation` | `encounter_id` | One output row per encounter |
| `analytics.fact_evaluation_event` | `status` | mart | `analytics.mart_case_evaluation` | `evaluation_state` | Derive `not_triggered`, `success`, `failed`, `timeout` at case level |
| `analytics.fact_outpatient_encounter` | `patient_id` | mart | `analytics.mart_outpatient_volume` | `unique_patient_outpatient_count` | Count distinct patients alongside encounter counts |
