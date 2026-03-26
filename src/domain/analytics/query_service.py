from __future__ import annotations

import json
import os
import subprocess
from dataclasses import asdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Protocol, cast

from .contracts import (
    AnalyticsFilters,
    DepartmentDistributionRow,
    DepartmentTypeOption,
    DiseaseInsightRow,
    EvaluationSplitRow,
    OverviewSummaryRow,
    PersistedRealtimeEvaluationRow,
    ProblemCaseDimension,
    ProblemCaseRow,
    ProblemCaseSummary,
    TrendSeriesRow,
)


class QueryExecutor(Protocol):
    def fetch_all(self, sql: str, params: list[Any]) -> list[dict[str, Any]]:
        """Return all query rows as dictionaries."""


class NodePgExecutor:
    """Tiny bridge that lets Python call the existing repo-local PostgreSQL access path."""

    def __init__(self, connection_string: str | None = None, root_dir: Path | None = None) -> None:
        self.connection_string = connection_string or os.environ.get("DATABASE_URL")
        self.root_dir = root_dir or Path(__file__).resolve().parents[3]

        if not self.connection_string:
            raise ValueError("DATABASE_URL is required to execute analytics queries")

    def fetch_all(self, sql: str, params: list[Any]) -> list[dict[str, Any]]:
        command = [
            "node",
            "scripts/query-pg.mjs",
            self.connection_string,
            sql,
            json.dumps(params, ensure_ascii=True),
        ]
        result = subprocess.run(
            command,
            cwd=self.root_dir,
            check=True,
            capture_output=True,
            text=True,
        )
        return cast(list[dict[str, Any]], json.loads(result.stdout or "[]"))


def _executor(executor: QueryExecutor | None = None, connection_string: str | None = None) -> QueryExecutor:
    if executor is not None:
        return executor
    return NodePgExecutor(connection_string=connection_string)


def _filter_params(filters: AnalyticsFilters) -> list[Any]:
    return [
        filters.range_key,
        filters.as_of_date,
        filters.start_date,
        filters.end_date,
        filters.department_ids or [],
        filters.department_type_ids or [],
        filters.doctor_ids or [],
        filters.disease_ids or [],
    ]


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)


def _coerce_int(value: Any) -> int | None:
    if value is None:
        return None
    return int(value)


def _coerce_date_string(value: Any) -> str:
    if value is None:
        raise ValueError("date value is required")
    if isinstance(value, date) and not isinstance(value, datetime):
        return value.isoformat()

    text = str(value)
    if "T" not in text:
        return date.fromisoformat(text).isoformat()

    normalized = text.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).date().isoformat()


def _coerce_json_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            decoded = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return decoded if isinstance(decoded, dict) else {}
    return {}


def _coerce_json_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            decoded = json.loads(value)
        except json.JSONDecodeError:
            return []
        return decoded if isinstance(decoded, list) else []
    return []


def _resolve_time_window(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> dict[str, Any]:
    rows = _executor(executor, connection_string).fetch_all(
        """
        select
          range_start_date as "rangeStartDate",
          range_end_date as "rangeEndDate",
          bucket_grain as "bucketGrain"
        from analytics.resolve_time_window($1, $2::date, $3::date, $4::date)
        """.strip(),
        [
            filters.range_key,
            filters.as_of_date,
            filters.start_date,
            filters.end_date,
        ],
    )
    if not rows:
        raise ValueError("analytics.resolve_time_window returned no rows")
    return rows[0]


def get_overview_summary(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> OverviewSummaryRow:
    rows = _executor(executor, connection_string).fetch_all(
        """
        select *
        from analytics.get_overview_summary($1, $2::date, $3::date, $4::date, $5::text[], $6::text[], $7::text[], $8::text[])
        """.strip(),
        _filter_params(filters),
    )
    if not rows:
        raise ValueError("analytics.get_overview_summary returned no rows")
    row = rows[0]
    return OverviewSummaryRow(
        outpatient_count=int(row["outpatientCount"]),
        unique_patient_outpatient_count=int(row["uniquePatientOutpatientCount"]),
        triggered_evaluation_count=int(row["triggeredEvaluationCount"]),
        success_evaluated_count=int(row["successEvaluatedCount"]),
        diagnosis_basis_incomplete_rate_by_success=_coerce_float(row["diagnosisBasisIncompleteRateBySuccess"]),
        diagnosis_basis_incomplete_rate_by_encounter=_coerce_float(row["diagnosisBasisIncompleteRateByEncounter"]),
        missing_diagnosis_rate_by_success=_coerce_float(row["missingDiagnosisRateBySuccess"]),
        missing_diagnosis_rate_by_encounter=_coerce_float(row["missingDiagnosisRateByEncounter"]),
        range_start_date=_coerce_date_string(row["rangeStartDate"]),
        range_end_date=_coerce_date_string(row["rangeEndDate"]),
        bucket_grain=cast(Any, row["bucketGrain"]),
    )


def get_previous_overview_summary(
    filters: AnalyticsFilters,
    *,
    current_summary: OverviewSummaryRow | None = None,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> OverviewSummaryRow | None:
    current_summary = current_summary or get_overview_summary(
        filters,
        executor=executor,
        connection_string=connection_string,
    )
    if current_summary.outpatient_count == 0:
        return None

    resolved = _resolve_time_window(
        filters,
        executor=executor,
        connection_string=connection_string,
    )
    range_start_date = date.fromisoformat(_coerce_date_string(resolved["rangeStartDate"]))
    range_end_date = date.fromisoformat(_coerce_date_string(resolved["rangeEndDate"]))
    window_length_days = (range_end_date - range_start_date).days + 1
    previous_end_date = range_start_date - timedelta(days=1)
    previous_start_date = previous_end_date - timedelta(days=window_length_days - 1)

    previous_filters = AnalyticsFilters(
        as_of_date=filters.as_of_date,
        range_key="custom",
        start_date=previous_start_date.isoformat(),
        end_date=previous_end_date.isoformat(),
        department_ids=filters.department_ids,
        department_type_ids=filters.department_type_ids,
        doctor_ids=filters.doctor_ids,
        disease_ids=filters.disease_ids,
    )
    previous_summary = get_overview_summary(
        previous_filters,
        executor=executor,
        connection_string=connection_string,
    )
    if previous_summary.outpatient_count == 0:
        return None
    return previous_summary


def get_trend_series(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> list[TrendSeriesRow]:
    rows = _executor(executor, connection_string).fetch_all(
        """
        select *
        from analytics.get_trend_series($1, $2::date, $3::date, $4::date, $5::text[], $6::text[], $7::text[], $8::text[])
        order by "bucketStart"
        """.strip(),
        _filter_params(filters),
    )
    return [
        TrendSeriesRow(
            outpatient_count=int(row["outpatientCount"]),
            unique_patient_outpatient_count=int(row["uniquePatientOutpatientCount"]),
            triggered_evaluation_count=int(row["triggeredEvaluationCount"]),
            success_evaluated_count=int(row["successEvaluatedCount"]),
            diagnosis_basis_incomplete_rate_by_success=_coerce_float(row["diagnosisBasisIncompleteRateBySuccess"]),
            diagnosis_basis_incomplete_rate_by_encounter=_coerce_float(row["diagnosisBasisIncompleteRateByEncounter"]),
            missing_diagnosis_rate_by_success=_coerce_float(row["missingDiagnosisRateBySuccess"]),
            missing_diagnosis_rate_by_encounter=_coerce_float(row["missingDiagnosisRateByEncounter"]),
            range_start_date=_coerce_date_string(row["rangeStartDate"]),
            range_end_date=_coerce_date_string(row["rangeEndDate"]),
            bucket_grain=cast(Any, row["bucketGrain"]),
            bucket_start=_coerce_date_string(row["bucketStart"]),
            bucket_end=_coerce_date_string(row["bucketEnd"]),
            bucket_label=str(row["bucketLabel"]),
        )
        for row in rows
    ]


def get_evaluation_split(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> EvaluationSplitRow:
    rows = _executor(executor, connection_string).fetch_all(
        """
        with scoped_cases as (
          select
            encounter.encounter_id,
            case_row.evaluation_state
          from analytics.fact_outpatient_encounter encounter
          join analytics.mart_case_evaluation case_row
            on case_row.encounter_id = encounter.encounter_id
          where (encounter.encounter_at at time zone 'Asia/Shanghai')::date between (
              select range_start_date
              from analytics.resolve_time_window($1, $2::date, $3::date, $4::date)
            ) and (
              select range_end_date
              from analytics.resolve_time_window($1, $2::date, $3::date, $4::date)
            )
            and (coalesce(cardinality($5::text[]), 0) = 0 or encounter.department_id = any($5::text[]))
            and (coalesce(cardinality($6::text[]), 0) = 0 or encounter.department_type_id = any($6::text[]))
            and (coalesce(cardinality($7::text[]), 0) = 0 or encounter.doctor_id = any($7::text[]))
            and (coalesce(cardinality($8::text[]), 0) = 0 or encounter.disease_id = any($8::text[]))
        )
        select
          count(*)::bigint as "outpatientCount",
          count(*) filter (where evaluation_state = 'not_triggered')::bigint as "notTriggeredCount",
          count(*) filter (where evaluation_state = 'success')::bigint as "successCount",
          count(*) filter (where evaluation_state = 'failed')::bigint as "failedCount",
          count(*) filter (where evaluation_state = 'timeout')::bigint as "timeoutCount"
        from scoped_cases
        """.strip(),
        _filter_params(filters),
    )
    if not rows:
        raise ValueError("evaluation split query returned no rows")
    row = rows[0]
    return EvaluationSplitRow(
        outpatient_count=int(row["outpatientCount"]),
        not_triggered_count=int(row["notTriggeredCount"]),
        success_count=int(row["successCount"]),
        failed_count=int(row["failedCount"]),
        timeout_count=int(row["timeoutCount"]),
    )


def get_department_distribution(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> list[DepartmentDistributionRow]:
    rows = _executor(executor, connection_string).fetch_all(
        """
        select *
        from analytics.get_department_distribution($1, $2::date, $3::date, $4::date, $5::text[], $6::text[], $7::text[], $8::text[])
        """.strip(),
        _filter_params(filters),
    )
    return [
        DepartmentDistributionRow(
            department_id=str(row["departmentId"]),
            department_name=str(row["departmentName"]),
            department_type_id=str(row["departmentTypeId"]),
            department_type_name=str(row["departmentTypeName"]),
            outpatient_count=int(row["outpatientCount"]),
            success_evaluated_count=int(row["successEvaluatedCount"]),
            diagnosis_basis_incomplete_rate_by_success=_coerce_float(row["diagnosisBasisIncompleteRateBySuccess"]),
            missing_diagnosis_rate_by_success=_coerce_float(row["missingDiagnosisRateBySuccess"]),
        )
        for row in rows
    ]


def get_available_department_types(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> list[DepartmentTypeOption]:
    rows = _executor(executor, connection_string).fetch_all(
        """
        with resolved as (
          select *
          from analytics.resolve_time_window($1, $2::date, $3::date, $4::date)
        )
        select distinct
          dept_type.department_type_id as "departmentTypeId",
          dept_type.department_type_name as "departmentTypeName"
        from analytics.fact_outpatient_encounter encounter
        join analytics.dim_department_type dept_type
          on dept_type.department_type_id = encounter.department_type_id
        cross join resolved
        where (encounter.encounter_at at time zone 'Asia/Shanghai')::date
          between resolved.range_start_date and resolved.range_end_date
          and (coalesce(cardinality($5::text[]), 0) = 0 or encounter.department_id = any($5::text[]))
          and (coalesce(cardinality($6::text[]), 0) = 0 or encounter.department_type_id = any($6::text[]))
          and (coalesce(cardinality($7::text[]), 0) = 0 or encounter.doctor_id = any($7::text[]))
          and (coalesce(cardinality($8::text[]), 0) = 0 or encounter.disease_id = any($8::text[]))
        order by "departmentTypeName" asc
        """.strip(),
        _filter_params(filters),
    )
    return [
        DepartmentTypeOption(
            department_type_id=str(row["departmentTypeId"]),
            department_type_name=str(row["departmentTypeName"]),
        )
        for row in rows
    ]


def get_disease_insights(
    filters: AnalyticsFilters,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> list[DiseaseInsightRow]:
    rows = _executor(executor, connection_string).fetch_all(
        """
        select *
        from analytics.get_disease_insights($1, $2::date, $3::date, $4::date, $5::text[], $6::text[], $7::text[], $8::text[])
        """.strip(),
        _filter_params(filters),
    )
    return [
        DiseaseInsightRow(
            disease_id=str(row["diseaseId"]),
            disease_name=str(row["diseaseName"]),
            issue_count=int(row["issueCount"]),
            diagnosis_basis_incomplete_count=int(row["diagnosisBasisIncompleteCount"]),
            missing_diagnosis_count=int(row["missingDiagnosisCount"]),
            severity_ratio=float(row["severityRatio"]),
            severity_band=cast(Any, row["severityBand"]),
        )
        for row in rows
    ]


def get_persisted_realtime_evaluation(
    evaluation_id: str,
    *,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> PersistedRealtimeEvaluationRow | None:
    rows = _executor(executor, connection_string).fetch_all(
        """
        select
          summary.evaluation_id as "evaluationId",
          summary.encounter_id as "encounterId",
          summary.case_id as "caseId",
          summary.status as "status",
          summary.diagnosis_basis_incomplete as "diagnosisBasisIncomplete",
          summary.missing_diagnosis as "missingDiagnosis",
          summary.quality_index_score as "qualityIndexScore",
          summary.elapsed_ms as "elapsedMs",
          detail.basis_completeness as "basisCompleteness",
          detail.rationale as "rationale",
          detail.suggestions as "suggestions",
          detail.potential_missing_diagnoses as "potentialMissingDiagnoses"
        from analytics.realtime_evaluation_summary summary
        left join realtime_evaluation_detail detail
          on detail.evaluation_id = summary.evaluation_id
        where summary.evaluation_id = $1
        limit 1
        """.strip(),
        [evaluation_id],
    )
    if not rows:
        return None

    row = rows[0]
    basis = _coerce_json_dict(row.get("basisCompleteness"))
    raw_missing = _coerce_json_list(row.get("potentialMissingDiagnoses"))
    missing = [
        {
            "disease_name": str(item.get("disease_name", "")),
            "confidence_label": str(item.get("confidence_label", "")),
            "rationale": str(item.get("rationale", "")),
        }
        for item in raw_missing
        if isinstance(item, dict) and item.get("disease_name")
    ]
    return PersistedRealtimeEvaluationRow(
        evaluation_id=str(row["evaluationId"]),
        encounter_id=str(row["encounterId"]),
        case_id=str(row["caseId"]),
        status=cast(Any, row["status"]),
        diagnosis_basis_incomplete=bool(row["diagnosisBasisIncomplete"]),
        missing_diagnosis=bool(row["missingDiagnosis"]),
        quality_index_score=_coerce_float(row.get("qualityIndexScore")),
        elapsed_ms=_coerce_int(row.get("elapsedMs")),
        basis_summary=str(basis["summary"]) if basis.get("summary") is not None else None,
        rationale=[str(item) for item in _coerce_json_list(row.get("rationale")) if item is not None],
        suggestions=[str(item) for item in _coerce_json_list(row.get("suggestions")) if item is not None],
        potential_missing_diagnoses=missing,
    )


def get_problem_case_rows(
    filters: AnalyticsFilters,
    *,
    dimension: ProblemCaseDimension,
    dimension_value: str,
    executor: QueryExecutor | None = None,
    connection_string: str | None = None,
) -> list[ProblemCaseRow]:
    rows = _executor(executor, connection_string).fetch_all(
        """
        with resolved as (
          select *
          from analytics.resolve_time_window($1, $2::date, $3::date, $4::date)
        ),
        ranked as (
          select
            evaluation.evaluation_id,
            evaluation.encounter_id,
            evaluation.case_id,
            evaluation.status,
            evaluation.diagnosis_basis_incomplete,
            evaluation.missing_diagnosis,
            evaluation.triggered_at,
            row_number() over (
              partition by evaluation.encounter_id
              order by evaluation.triggered_at desc, evaluation.evaluation_id desc
            ) as evaluation_rank
          from analytics.realtime_evaluation_summary evaluation
        )
        select
          encounter.encounter_id as "encounterId",
          encounter.patient_id as "patientName",
          encounter.department_id as "departmentId",
          department.department_name as "departmentName",
          encounter.doctor_id as "doctorId",
          doctor.doctor_name as "doctorName",
          encounter.disease_id as "diseaseId",
          coalesce(disease.disease_name, encounter.disease_id, '未记录') as "primaryDiagnosisName",
          ranked.status as "evaluationStatus",
          ranked.diagnosis_basis_incomplete as "diagnosisBasisIncomplete",
          ranked.missing_diagnosis as "missingDiagnosis",
          ranked.triggered_at as "triggeredAt"
        from analytics.fact_outpatient_encounter encounter
        join analytics.dim_department department
          on department.department_id = encounter.department_id
        join analytics.dim_doctor doctor
          on doctor.doctor_id = encounter.doctor_id
        left join analytics.dim_disease disease
          on disease.disease_id = encounter.disease_id
        join ranked
          on ranked.encounter_id = encounter.encounter_id
         and ranked.evaluation_rank = 1
        cross join resolved
        where (encounter.encounter_at at time zone 'Asia/Shanghai')::date
          between resolved.range_start_date and resolved.range_end_date
          and (coalesce(cardinality($5::text[]), 0) = 0 or encounter.department_id = any($5::text[]))
          and (coalesce(cardinality($6::text[]), 0) = 0 or encounter.department_type_id = any($6::text[]))
          and (coalesce(cardinality($7::text[]), 0) = 0 or encounter.doctor_id = any($7::text[]))
          and (coalesce(cardinality($8::text[]), 0) = 0 or encounter.disease_id = any($8::text[]))
          and (
            case
              when $9 = 'department' then encounter.department_id = $10
              when $9 = 'doctor' then encounter.doctor_id = $10
              when $9 = 'disease' then encounter.disease_id = $10
              else false
            end
          )
          and (
            ranked.diagnosis_basis_incomplete
            or ranked.missing_diagnosis
            or ranked.status in ('failed', 'timeout')
          )
        order by ranked.triggered_at desc, encounter.encounter_id desc
        """.strip(),
        [*_filter_params(filters), dimension, dimension_value],
    )
    return [
        ProblemCaseRow(
            encounter_id=str(row["encounterId"]),
            patient_name=str(row["patientName"]),
            department_id=str(row["departmentId"]),
            department_name=str(row["departmentName"]),
            doctor_id=str(row["doctorId"]),
            doctor_name=str(row["doctorName"]),
            disease_id=str(row["diseaseId"]) if row.get("diseaseId") is not None else None,
            primary_diagnosis_name=str(row["primaryDiagnosisName"]),
            evaluation_status=cast(Any, row["evaluationStatus"]),
            diagnosis_basis_incomplete=bool(row["diagnosisBasisIncomplete"]),
            missing_diagnosis=bool(row["missingDiagnosis"]),
            triggered_at=str(row["triggeredAt"]),
        )
        for row in rows
    ]


def summarize_problem_case_rows(rows: list[ProblemCaseRow]) -> ProblemCaseSummary:
    return ProblemCaseSummary(
        total_case_count=len(rows),
        diagnosis_basis_incomplete_count=sum(1 for row in rows if row.diagnosis_basis_incomplete),
        missing_diagnosis_count=sum(1 for row in rows if row.missing_diagnosis),
    )


def serialize_filters(filters: AnalyticsFilters) -> dict[str, Any]:
    return asdict(filters)
