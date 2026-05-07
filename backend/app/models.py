from datetime import date, datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Organization(TimestampMixin, table=True):
    __tablename__ = "organizations"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: str = "合作社"
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None


class User(TimestampMixin, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    phone: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = None
    role: str = "farmer"
    organization_id: Optional[int] = Field(default=None, foreign_key="organizations.id")
    status: str = "active"


class Plot(TimestampMixin, table=True):
    __tablename__ = "plots"
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: Optional[int] = Field(default=None, foreign_key="organizations.id")
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    plot_name: str
    plot_code: str = Field(index=True, unique=True)
    area: float
    province: str = "湖南省"
    city: str = "衡阳市"
    county: str = "常宁市"
    town: str = "示范镇"
    village: str = "油茶村"
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    variety: str = "普通油茶"
    tree_age: int = 5
    plant_year: int = 2020
    soil_type: str = "红壤"
    management_mode: str = "智能管理"
    irrigation_type: Optional[str] = None
    soil_ph: Optional[float] = None
    sensor_device_id: Optional[str] = None
    current_stage: Optional[str] = None
    remark: Optional[str] = None


class EnvironmentRecord(SQLModel, table=True):
    __tablename__ = "environment_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    soil_moisture: float
    soil_temperature: float
    air_temperature: float
    air_humidity: float
    light_intensity: float
    ph_value: float
    rainfall: float = 0
    wind_speed: float = 0
    data_source: str = "manual"
    recorded_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GrowthStage(TimestampMixin, table=True):
    __tablename__ = "growth_stages"
    id: Optional[int] = Field(default=None, primary_key=True)
    stage_name: str
    start_month: int
    start_day: int
    end_month: int
    end_day: int
    priority: int = 0
    description: Optional[str] = None
    management_focus: Optional[str] = None


class DecisionRule(TimestampMixin, table=True):
    __tablename__ = "decision_rules"
    id: Optional[int] = Field(default=None, primary_key=True)
    stage_id: Optional[int] = Field(default=None, foreign_key="growth_stages.id")
    rule_name: str
    condition_json: str
    suggestion_type: str
    suggestion_content: str
    risk_level: str = "关注"
    enabled: bool = True
    priority: int = 0
    rule_version: str = "1.0"
    applicable_region: Optional[str] = None
    applicable_variety: Optional[str] = None
    requires_expert_review: bool = False


class DecisionRecord(SQLModel, table=True):
    __tablename__ = "decision_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    stage_name: str
    input_json: str
    matched_rule_id: Optional[int] = Field(default=None, foreign_key="decision_rules.id")
    suggestion_type: str = "综合建议"
    suggestion_content: str
    risk_level: str = "关注"
    confidence: str = "medium"
    data_source: str = "manual"
    review_status: str = "pending"
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
    is_executed: bool = False
    execution_status: str = "not_executed"
    execution_cost: float = 0
    execution_image_url: Optional[str] = None
    feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WarningRecord(SQLModel, table=True):
    __tablename__ = "warning_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    warning_type: str
    warning_level: str
    warning_content: str
    suggestion: str
    trigger_condition: Optional[str] = None
    data_source: str = "manual"
    status: str = "未处理"
    handled_by: Optional[int] = Field(default=None, foreign_key="users.id")
    handled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class GrowthRecord(SQLModel, table=True):
    __tablename__ = "growth_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    management_type: str = "智能管理"
    tree_age: int = 5
    shoot_length: float
    leaf_color: str
    leaf_status: str
    disease_level: str
    flowering_status: str
    fruiting_status: str
    fruit_status: str
    growth_score: int = 100
    data_source: str = "manual"
    image_url: Optional[str] = None
    remark: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PestDiseaseKnowledge(TimestampMixin, table=True):
    __tablename__ = "pest_disease_knowledge"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: str
    symptoms: str
    cause: str
    risk_condition: str
    prevention_method: str
    treatment_method: str
    image_url: Optional[str] = None


class DiagnosisRecord(SQLModel, table=True):
    __tablename__ = "diagnosis_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    symptoms: str
    possible_result: str
    risk_level: str
    suggestion: str
    image_url: Optional[str] = None
    data_source: str = "manual"
    expert_review: str = "待复核"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FarmingLog(TimestampMixin, table=True):
    __tablename__ = "farming_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    operation_type: str
    operation_time: datetime = Field(default_factory=datetime.utcnow, index=True)
    operator: str
    materials: Optional[str] = None
    dosage: Optional[str] = None
    cost: float = 0
    description: Optional[str] = None
    image_url: Optional[str] = None
    execution_image_url: Optional[str] = None
    data_source: str = "manual"
    linked_decision_id: Optional[int] = Field(default=None, foreign_key="decision_records.id")


class FileAsset(SQLModel, table=True):
    __tablename__ = "files"
    id: Optional[int] = Field(default=None, primary_key=True)
    file_name: str
    file_url: str
    file_type: str
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    uploaded_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class KnowledgeArticle(TimestampMixin, table=True):
    __tablename__ = "knowledge_articles"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    category: str
    summary: str
    content: str
    image_url: Optional[str] = None
    status: str = "published"


class ExpertReview(SQLModel, table=True):
    __tablename__ = "expert_reviews"
    id: Optional[int] = Field(default=None, primary_key=True)
    record_type: str
    record_id: int = Field(index=True)
    expert_id: int = Field(foreign_key="users.id")
    review_result: str
    review_comment: Optional[str] = None
    reviewed_at: datetime = Field(default_factory=datetime.utcnow)


class SensorDevice(SQLModel, table=True):
    __tablename__ = "sensor_devices"
    id: Optional[int] = Field(default=None, primary_key=True)
    device_code: str = Field(unique=True)
    plot_id: Optional[int] = Field(default=None, foreign_key="plots.id")
    device_type: str
    status: str = "online"
    last_online: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WeatherRecord(SQLModel, table=True):
    __tablename__ = "weather_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    plot_id: int = Field(foreign_key="plots.id", index=True)
    temperature_high: Optional[float] = None
    temperature_low: Optional[float] = None
    rainfall: Optional[float] = None
    rainfall_prob: Optional[float] = None
    weather_desc: Optional[str] = None
    forecast_date: date = Field(index=True)
    data_source: str = "weather"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SystemConfig(SQLModel, table=True):
    __tablename__ = "system_config"
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    value: str
    description: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
