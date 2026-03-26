from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

AnalyticsTimeRangeKey = Literal[
    "last_7_days",
    "last_30_days",
    "last_3_months",
    "last_6_months",
    "last_12_months",
    "previous_week",
    "previous_month",
    "previous_quarter",
    "previous_year",
    "custom",
]

BucketGrain = Literal["shift", "day", "week", "month"]


@dataclass(slots=True)
class AnalyticsFilters:
    as_of_date: str
    range_key: AnalyticsTimeRangeKey
    start_date: str | None = None
    end_date: str | None = None
    # These are backend-applied SQL filters, not UI-only placeholders.
    department_ids: list[str] | None = None
    department_type_ids: list[str] | None = None
    doctor_ids: list[str] | None = None
    disease_ids: list[str] | None = None


@dataclass(slots=True)
class OverviewSummaryRow:
    outpatient_count: int
    unique_patient_outpatient_count: int
    triggered_evaluation_count: int
    success_evaluated_count: int
    diagnosis_basis_incomplete_rate_by_success: float | None
    diagnosis_basis_incomplete_rate_by_encounter: float | None
    missing_diagnosis_rate_by_success: float | None
    missing_diagnosis_rate_by_encounter: float | None
    range_start_date: str
    range_end_date: str
    bucket_grain: BucketGrain


@dataclass(slots=True)
class TrendSeriesRow(OverviewSummaryRow):
    bucket_start: str
    bucket_end: str
    bucket_label: str


@dataclass(slots=True)
class EvaluationSplitRow:
    outpatient_count: int
    not_triggered_count: int
    success_count: int
    failed_count: int
    timeout_count: int


@dataclass(slots=True)
class DepartmentDistributionRow:
    department_id: str
    department_name: str
    department_type_id: str
    department_type_name: str
    outpatient_count: int
    success_evaluated_count: int
    diagnosis_basis_incomplete_rate_by_success: float | None
    missing_diagnosis_rate_by_success: float | None


@dataclass(slots=True)
class DepartmentTypeOption:
    department_type_id: str
    department_type_name: str


DiseaseSeverityBand = Literal["top_20", "top_50", "top_70", "tail"]
ProblemCaseDimension = Literal["department", "doctor", "disease"]


@dataclass(slots=True)
class DiseaseInsightRow:
    disease_id: str
    disease_name: str
    issue_count: int
    diagnosis_basis_incomplete_count: int
    missing_diagnosis_count: int
    severity_ratio: float
    severity_band: DiseaseSeverityBand


@dataclass(slots=True)
class ProblemCaseRow:
    encounter_id: str
    patient_name: str
    department_id: str
    department_name: str
    doctor_id: str
    doctor_name: str
    disease_id: str | None
    primary_diagnosis_name: str
    evaluation_status: Literal["success", "timeout", "failed"]
    diagnosis_basis_incomplete: bool
    missing_diagnosis: bool
    triggered_at: str


@dataclass(slots=True)
class ProblemCaseSummary:
    total_case_count: int
    diagnosis_basis_incomplete_count: int
    missing_diagnosis_count: int


@dataclass(slots=True)
class PersistedRealtimeEvaluationRow:
    evaluation_id: str
    encounter_id: str
    case_id: str
    status: Literal["pending", "success", "timeout", "failed"]
    diagnosis_basis_incomplete: bool
    missing_diagnosis: bool
    quality_index_score: float | None
    elapsed_ms: int | None
    basis_summary: str | None
    rationale: list[str]
    suggestions: list[str]
    potential_missing_diagnoses: list[dict[str, str]]
