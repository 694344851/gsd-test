# Phase 1 Source Inventory

## Source Contracts

| source_contract | description | grain | primary_key | fallback_key | dedup_rule |
|---|---|---|---|---|---|
| `src_outpatient_encounters` | 门诊就诊主数据占位源，承载每次门诊就诊的基础属性 | one row per source extract of encounter | `encounter_id` | none | latest `extract_ts` per `encounter_id` |
| `src_outpatient_diagnoses` | 门诊诊断结果占位源，承载就诊对应病种与诊断版本 | one row per encounter-disease version | `encounter_id` + `disease_code` | `case_id` | latest `diagnosis_version` per `encounter_id` + `disease_code` |
| `src_evaluation_events` | 诊鉴评估事件占位源，承载每次触发后的状态和质量标记 | one row per evaluation attempt extract | `evaluation_id` | `case_id` | latest `triggered_at` per `evaluation_id` |

## Join-Key Validation

- `encounter_id` is the primary visit key across outpatient, diagnosis, and evaluation data.
- `case_id` is the fallback correlation key when an evaluation payload omits `encounter_id`.
- Rows with both `encounter_id` and `case_id` null must be dropped and logged before fact loading.
- Outpatient source rows are deduplicated by the latest `extract_ts` per `encounter_id`.
- Diagnosis source rows are deduplicated by the latest `diagnosis_version` per `encounter_id + disease_code`.
- Evaluation source rows are deduplicated by the latest `triggered_at` per `evaluation_id`.

## Handling Rules

| source_contract | null-key handling | duplicate handling | load expectation |
|---|---|---|---|
| `src_outpatient_encounters` | Drop and log rows with both keys null | Keep the latest extract only | Provides the canonical encounter shell for downstream facts |
| `src_outpatient_diagnoses` | Drop and log rows with both keys null | Keep the highest diagnosis version | Enriches encounter facts with diagnosis presence and disease dimension mapping |
| `src_evaluation_events` | Drop and log rows with both keys null | Keep the latest event extract per evaluation id | Feeds evaluation event fact and case-level semantic rollup |
