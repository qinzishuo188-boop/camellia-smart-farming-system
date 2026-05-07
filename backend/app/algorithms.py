import json
from datetime import date, datetime, timedelta
from typing import Iterable
from sqlmodel import Session, select
from .models import DecisionRule, EnvironmentRecord, FarmingLog, GrowthRecord, GrowthStage, Plot, WarningRecord


def date_in_stage(today: date, stage: GrowthStage) -> bool:
    start = (stage.start_month, stage.start_day)
    end = (stage.end_month, stage.end_day)
    current = (today.month, today.day)
    if start <= end:
        return start <= current <= end
    return current >= start or current <= end


def detect_growth_stage(session: Session, day: date | None = None) -> str:
    day = day or date.today()
    stages = session.exec(select(GrowthStage).order_by(GrowthStage.priority.desc())).all()
    for stage in stages:
        if date_in_stage(day, stage):
            return stage.stage_name
    return "未配置阶段"


def assess_environment(record: EnvironmentRecord) -> list[dict[str, str]]:
    warnings: list[dict[str, str]] = []
    if record.soil_moisture < 30:
        warnings.append({"type": "干旱预警", "level": "警告", "condition": f"土壤湿度{record.soil_moisture}% < 30%阈值", "content": "土壤湿度低于 30%，存在干旱风险。", "suggestion": "建议及时灌溉，保持根区土壤湿润。"})
    if record.soil_moisture > 80:
        warnings.append({"type": "积水预警", "level": "警告", "condition": f"土壤湿度{record.soil_moisture}% > 80%阈值", "content": "土壤湿度高于 80%，存在积水风险。", "suggestion": "建议疏通排水沟，防止根系缺氧和裂果。"})
    if record.air_temperature < 0:
        warnings.append({"type": "冻害预警", "level": "严重", "condition": f"空气温度{record.air_temperature}℃ < 0℃", "content": "空气温度低于 0℃，存在冻害风险。", "suggestion": "建议覆盖防寒、树干包扎并减少夜间冷风影响。"})
    if record.air_temperature > 35:
        warnings.append({"type": "高温预警", "level": "警告", "condition": f"空气温度{record.air_temperature}℃ > 35℃", "content": "空气温度高于 35℃，存在高温胁迫。", "suggestion": "建议早晚补水，必要时遮阴降温。"})
    if record.air_humidity > 85 and record.air_temperature > 25:
        warnings.append({"type": "病害风险预警", "level": "警告", "condition": f"空气湿度{record.air_humidity}% > 85% 且 气温{record.air_temperature}℃ > 25℃", "content": "高温高湿条件叠加，病害发生风险升高。", "suggestion": "建议加强通风，巡查叶片、花果并做好绿色防控。"})
    if record.ph_value < 5.0 or record.ph_value > 7.0:
        warnings.append({"type": "土壤 pH 异常预警", "level": "关注", "condition": f"土壤pH {record.ph_value} 超出5.0-7.0范围", "content": "土壤 pH 超出 5.0-7.0 适宜范围。", "suggestion": "建议复测土壤酸碱度并进行改良。"})
    if record.light_intensity < 2500:
        warnings.append({"type": "光照不足预警", "level": "关注", "condition": f"光照强度{record.light_intensity}lux < 2500lux", "content": "光照强度偏低，可能影响光合作用。", "suggestion": "建议检查遮挡、合理修剪改善通风透光。"})
    return warnings


def create_warnings_for_record(session: Session, record: EnvironmentRecord) -> list[WarningRecord]:
    created: list[WarningRecord] = []
    for item in assess_environment(record):
        warning = WarningRecord(
            plot_id=record.plot_id,
            warning_type=item["type"],
            warning_level=item["level"],
            warning_content=item["content"],
            suggestion=item["suggestion"],
            trigger_condition=item.get("condition", ""),
            data_source=record.data_source,
        )
        session.add(warning)
        created.append(warning)
    session.commit()
    for warning in created:
        session.refresh(warning)
    return created


def latest_environment(session: Session, plot_id: int) -> EnvironmentRecord | None:
    return session.exec(
        select(EnvironmentRecord).where(EnvironmentRecord.plot_id == plot_id).order_by(EnvironmentRecord.recorded_at.desc())
    ).first()


def calculate_confidence(session: Session, plot_id: int, record: EnvironmentRecord) -> str:
    now = datetime.utcnow()
    hours_since = (now - record.recorded_at).total_seconds() / 3600 if record.recorded_at else 999

    key_fields = ["soil_moisture", "air_temperature", "air_humidity", "ph_value", "light_intensity"]
    values_present = sum(1 for f in key_fields if getattr(record, f, None) not in (None, 0))

    recent_env_count = len(session.exec(
        select(EnvironmentRecord).where(
            EnvironmentRecord.plot_id == plot_id,
            EnvironmentRecord.recorded_at >= now - timedelta(days=7)
        )
    ).all())

    recent_growth = session.exec(
        select(GrowthRecord).where(
            GrowthRecord.plot_id == plot_id,
            GrowthRecord.recorded_at >= now - timedelta(days=30)
        )
    ).first()

    score = 0
    if values_present >= 5:
        score += 30
    elif values_present >= 3:
        score += 15
    if hours_since <= 24:
        score += 25
    elif hours_since <= 72:
        score += 15
    if recent_env_count >= 5:
        score += 25
    elif recent_env_count >= 2:
        score += 10
    if recent_growth is not None:
        score += 20

    if score >= 70:
        return "high"
    elif score >= 40:
        return "medium"
    return "low"


def check_data_completeness(session: Session, plot_id: int) -> dict:
    now = datetime.utcnow()
    env_count = len(session.exec(
        select(EnvironmentRecord).where(
            EnvironmentRecord.plot_id == plot_id,
            EnvironmentRecord.recorded_at >= now - timedelta(days=30)
        )
    ).all())
    growth_count = len(session.exec(
        select(GrowthRecord).where(
            GrowthRecord.plot_id == plot_id,
            GrowthRecord.recorded_at >= now - timedelta(days=90)
        )
    ).all())
    log_count = len(session.exec(
        select(FarmingLog).where(
            FarmingLog.plot_id == plot_id,
            FarmingLog.operation_time >= now - timedelta(days=90)
        )
    ).all())

    missing = []
    if env_count == 0:
        missing.append("环境监测数据（近30天）")
    if growth_count == 0:
        missing.append("田间巡查记录（近90天）")
    if log_count == 0:
        missing.append("农事操作记录（近90天）")

    is_complete = len(missing) == 0 and env_count >= 3
    recommendation = ""
    if not is_complete:
        if missing:
            recommendation = f"当前数据不足，建议补充：{'、'.join(missing)}。数据充分后再生成精准建议。"
        else:
            recommendation = "建议增加环境监测频次（至少每日1次），持续积累数据后再生成决策建议。"

    return {
        "plot_id": plot_id,
        "environment_records_count": env_count,
        "growth_records_count": growth_count,
        "farming_logs_count": log_count,
        "missing_types": missing,
        "is_complete": is_complete,
        "recommendation": recommendation,
    }


def match_condition(condition: dict, record: EnvironmentRecord) -> bool:
    for key, rule in condition.items():
        value = getattr(record, key, None)
        if value is None:
            return False
        if "lt" in rule and not value < rule["lt"]:
            return False
        if "lte" in rule and not value <= rule["lte"]:
            return False
        if "gt" in rule and not value > rule["gt"]:
            return False
        if "gte" in rule and not value >= rule["gte"]:
            return False
        if "between" in rule:
            low, high = rule["between"]
            if not low <= value <= high:
                return False
    return True


def generate_decisions(session: Session, plot: Plot, record: EnvironmentRecord) -> list[tuple[DecisionRule | None, str, str, str, str, str]]:
    stage_name = plot.current_stage or detect_growth_stage(session)
    rules = session.exec(select(DecisionRule).where(DecisionRule.enabled == True).order_by(DecisionRule.priority.desc())).all()
    confidence = calculate_confidence(session, plot.id, record)
    matched: list[tuple[DecisionRule | None, str, str, str, str, str]] = []
    for rule in rules:
        stage = session.get(GrowthStage, rule.stage_id) if rule.stage_id else None
        if stage and stage.stage_name != stage_name:
            continue
        if match_condition(json.loads(rule.condition_json), record):
            matched.append((rule, rule.suggestion_type, rule.suggestion_content, rule.risk_level, confidence, rule.rule_version))
    if not matched:
        if confidence == "low":
            content = "当前数据不足以生成确定性建议，建议补充土壤湿度、气温、降雨、长势记录后再生成精准建议。"
        else:
            content = "当前监测指标总体平稳，建议保持常规巡园、适度水肥管理，并持续记录长势。"
        matched.append((None, "综合建议", content, "正常", confidence, "1.0"))
    return matched


def calculate_growth_score(record: GrowthRecord) -> int:
    score = 100
    score -= {"轻微": 10, "中等": 25, "严重": 40}.get(record.disease_level, 0)
    score -= {"浅绿": 5, "发黄": 15, "枯黄": 30}.get(record.leaf_color, 0)
    score -= {"卷曲": 8, "斑点": 15, "脱落": 20}.get(record.leaf_status, 0)
    score -= {"裂果": 15, "霉变": 30, "脱落": 20}.get(record.fruit_status, 0)
    if record.shoot_length < 8:
        score -= 20
    elif record.shoot_length < 12:
        score -= 10
    return max(0, min(100, score))


def compare_growth(records: Iterable[GrowthRecord]) -> dict:
    groups: dict[str, list[GrowthRecord]] = {}
    for record in records:
        groups.setdefault(record.management_type, []).append(record)
    result = {}
    for mode, items in groups.items():
        total = len(items) or 1
        result[mode] = {
            "count": len(items),
            "avg_shoot_length": round(sum(i.shoot_length for i in items) / total, 2),
            "avg_growth_score": round(sum(i.growth_score for i in items) / total, 2),
            "green_leaf_rate": round(sum(1 for i in items if i.leaf_color in ["深绿", "浅绿"]) / total * 100, 1),
            "healthy_rate": round(sum(1 for i in items if i.disease_level in ["无", "轻微"]) / total * 100, 1),
            "disease_rate": round(sum(1 for i in items if i.disease_level not in ["无"]) / total * 100, 1),
            "fruiting_rate": round(sum(1 for i in items if i.fruiting_status in ["正常", "较多"]) / total * 100, 1),
        }
    return result
