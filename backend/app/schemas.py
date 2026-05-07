from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    phone: Optional[str] = None
    email: Optional[str] = None
    role: str = "farmer"
    organization_id: Optional[int] = None


class PasswordRequest(BaseModel):
    old_password: str
    new_password: str


class DecisionGenerateRequest(BaseModel):
    plot_id: int


class WarningGenerateRequest(BaseModel):
    plot_id: Optional[int] = None


class DiagnosisRequest(BaseModel):
    plot_id: int
    symptoms: list[str]
    image_url: Optional[str] = None


class HandleWarningRequest(BaseModel):
    note: Optional[str] = None


class ExecuteDecisionRequest(BaseModel):
    feedback: Optional[str] = None
    execution_status: str = "executed"
    execution_cost: float = 0
    execution_image_url: Optional[str] = None


class ImportRowsRequest(BaseModel):
    rows: list[dict[str, Any]]


class ReportQuery(BaseModel):
    plot_id: Optional[int] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class ExpertReviewRequest(BaseModel):
    record_type: str
    record_id: int
    review_result: str
    review_comment: Optional[str] = None


class SystemModeRequest(BaseModel):
    mode: str


class DataCompletenessQuery(BaseModel):
    plot_id: int
